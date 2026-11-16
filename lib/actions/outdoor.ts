"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { canTake, capacityProblem, eventProblems, isListed, type Places, places, slugify, uniqueSlug } from "@/lib/domain/events/rules";
import { logServerError } from "@/lib/errors/server";
import { confirmedPeople, lockSession } from "@/lib/events/store";
import { fromStudioTime, STUDIO_TIME_ZONE, toStudioTime } from "@/lib/utils/time";
import { eventSchema, reservationSchema } from "@/lib/validators/event";
import { type RebuildOutcome, requestSiteRebuild } from "@/lib/website/rebuild";
import { db } from "@/services/database";
import { type BookingRequest, bookingRequests, sessionPhotos, type StudioSession, studioSessions } from "@/services/database/schema";
import { getValidAccessToken, googleErrorMessage, updateStudioEvent } from "@/services/google";

import { and, desc, eq, isNotNull, sql } from "drizzle-orm";

type Result = { success?: true; error?: string; ref?: string; website?: RebuildOutcome };

/** An outdoor session with what its page shows: its places, its photo, and who's coming. */
export type OutdoorSession = StudioSession & { places: Places; hasPhoto: boolean; photoVersion: number | null; reservations: BookingRequest[] };

class Refused extends Error {}

function refresh(googleEventId: string) {
	revalidatePath(`/schedule/outdoor/${googleEventId}`);
	revalidatePath("/schedule");
	revalidatePath("/bookings");
}

/**
 * An outdoor session by its Google Calendar id, as the Schedule knows it.
 * Null when it isn't an outdoor session the dashboard created (one made in
 * Google Calendar itself has no record to hold its website part).
 */
export async function getOutdoorSession(googleEventId: string): Promise<{ data?: OutdoorSession | null; error?: string; ref?: string }> {
	await requireUser();
	try {
		const [session] = await db
			.select()
			.from(studioSessions)
			.where(and(eq(studioSessions.googleEventId, googleEventId), eq(studioSessions.type, "outdoor")));
		if (!session) return { data: null };
		const [reservations, people, [photo]] = await Promise.all([
			db.select().from(bookingRequests).where(eq(bookingRequests.sessionId, session.id)).orderBy(desc(bookingRequests.createdAt)),
			confirmedPeople(session.id),
			db.select({ updatedAt: sessionPhotos.updatedAt }).from(sessionPhotos).where(eq(sessionPhotos.sessionId, session.id)),
		]);
		return {
			data: {
				...session,
				places: places(session.capacity, people),
				hasPhoto: !!photo,
				photoVersion: photo ? photo.updatedAt.getTime() : null,
				reservations,
			},
		};
	} catch (error) {
		return { error: "Couldn't load this session", ref: logServerError("Loading an outdoor session", error) };
	}
}

const pad = (n: number) => String(n).padStart(2, "0");
/** An instant as the studio's wall clock, "YYYY-MM-DDTHH:mm:00", for Google with the studio's zone. */
const wallClock = (instant: Date) => {
	const t = toStudioTime(instant);
	return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}:00`;
};

/**
 * Saves an outdoor session: its title, day, times and price (her calendar
 * follows, or nothing changes), and its website part. Its address on the site
 * comes from the title the first time it shows, and stays. The website is
 * rebuilt when it shows the session, or did.
 */
export async function saveOutdoorAction(sessionId: string, data: unknown): Promise<Result> {
	const user = await requireUser();
	const parsed = eventSchema.safeParse(data);
	if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the session" };
	const v = parsed.data;
	const startsAt = fromStudioTime(v.date, v.startTime);
	const endsAt = fromStudioTime(v.date, v.endTime);
	const capacity = v.limited ? v.capacity : null;
	const problems = eventProblems({ ...v, startsAt, endsAt, capacity });
	if (problems.length) return { error: problems[0] };

	let saved: StudioSession;
	let wasListed = false;
	try {
		saved = await db.transaction(async (tx) => {
			const before = await lockSession(tx, sessionId);
			if (!before || before.type !== "outdoor") throw new Refused("This outdoor session no longer exists.");
			if (before.status === "cancelled") throw new Refused("This session is cancelled.");
			wasListed = isListed(before);
			const problem = capacityProblem(capacity, await confirmedPeople(before.id, tx));
			if (problem) throw new Refused(problem);

			// The calendar first: when Google refuses, the transaction rolls back and nothing changes.
			const calendarChanged =
				before.title !== v.title ||
				before.startsAt.getTime() !== startsAt.getTime() ||
				before.endsAt.getTime() !== endsAt.getTime() ||
				Number(before.price ?? NaN) !== v.price;
			if (calendarChanged) {
				let token: string;
				try {
					token = await getValidAccessToken(user.id);
					await updateStudioEvent(token, before.googleEventId, {
						title: v.title,
						startTime: wallClock(startsAt),
						endTime: wallClock(endsAt),
						timeZone: STUDIO_TIME_ZONE,
						outdoorPrice: v.price,
					});
				} catch (error) {
					throw new Refused(googleErrorMessage(error, "Google Calendar"));
				}
			}

			const listing = { onWebsite: v.onWebsite, descriptionFr: v.descriptionFr, placeName: v.placeName, status: before.status };
			const shows = isListed({ ...listing, slug: before.slug ?? "pending" });
			const slug =
				before.slug ??
				(shows
					? uniqueSlug(
							slugify(v.title),
							(await tx.select({ slug: studioSessions.slug }).from(studioSessions).where(isNotNull(studioSessions.slug))).map((s) => s.slug!),
						)
					: null);
			const [row] = await tx
				.update(studioSessions)
				.set({
					title: v.title,
					startsAt,
					endsAt,
					price: v.price.toFixed(2),
					onWebsite: v.onWebsite,
					titleEn: v.titleEn || null,
					descriptionFr: v.descriptionFr || null,
					descriptionEn: v.descriptionEn || null,
					placeName: v.placeName || null,
					placeMapsUrl: v.placeMapsUrl || null,
					capacity,
					slug,
					publishedAt: before.publishedAt ?? (shows ? new Date() : null),
				})
				.where(eq(studioSessions.id, sessionId))
				.returning();
			return row;
		});
	} catch (error) {
		if (error instanceof Refused) return { error: error.message };
		return { error: "Couldn't save the session", ref: logServerError("Saving an outdoor session", error) };
	}

	refresh(saved.googleEventId);
	const website = isListed(saved) || wasListed ? await requestSiteRebuild("an outdoor session") : undefined;
	return { success: true, website };
}

const PHOTO_TYPES = ["image/webp", "image/jpeg", "image/png"];
const MAX_PHOTO = 1_500_000;

/** Saves the session's photo for the website (already resized in her browser). */
export async function uploadOutdoorPhotoAction(sessionId: string, form: FormData): Promise<Result> {
	await requireUser();
	const file = form.get("photo");
	if (!(file instanceof File) || !file.size) return { error: "Choose a photo." };
	if (!PHOTO_TYPES.includes(file.type)) return { error: "A photo in JPEG, PNG or WebP." };
	if (file.size > MAX_PHOTO) return { error: "This photo is too big, even resized. Try another." };
	try {
		const [session] = await db.select().from(studioSessions).where(eq(studioSessions.id, sessionId));
		if (!session) return { error: "This session no longer exists." };
		const data = Buffer.from(await file.arrayBuffer());
		await db
			.insert(sessionPhotos)
			.values({ sessionId, mime: file.type, data, updatedAt: new Date() })
			.onConflictDoUpdate({ target: sessionPhotos.sessionId, set: { mime: file.type, data, updatedAt: new Date() } });
		refresh(session.googleEventId);
		return { success: true, website: isListed(session) ? await requestSiteRebuild("a session's photo") : undefined };
	} catch (error) {
		return { error: "Couldn't save the photo", ref: logServerError("Saving a session photo", error) };
	}
}

/**
 * A reservation she takes outside the website (WhatsApp, phone, in person):
 * saved as confirmed, so it takes its places, never past the limit.
 */
export async function addReservationAction(sessionId: string, data: unknown): Promise<Result> {
	await requireUser();
	const parsed = reservationSchema.safeParse(data);
	if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the reservation" };
	const r = parsed.data;
	try {
		const session = await db.transaction(async (tx) => {
			const s = await lockSession(tx, sessionId);
			if (!s) throw new Refused("This session no longer exists.");
			if (s.status === "cancelled") throw new Refused("This session is cancelled.");
			const taken = await confirmedPeople(sessionId, tx);
			if (!canTake(s.capacity, taken, r.partySize)) {
				throw new Refused(`Full: ${taken} of ${s.capacity} places confirmed. Raise the limit to add ${r.partySize === 1 ? "someone" : "this group"}.`);
			}
			await tx.insert(bookingRequests).values({
				kind: "event",
				sessionId,
				choiceKey: s.slug,
				choiceLabel: s.title,
				name: r.name,
				phone: r.phone,
				partySize: r.partySize,
				source: r.source,
				clientId: r.clientId,
				status: "confirmed",
				statusChangedAt: new Date(),
			});
			return s;
		});
		refresh(session.googleEventId);
		return { success: true };
	} catch (error) {
		if (error instanceof Refused) return { error: error.message };
		return { error: "Couldn't add the reservation", ref: logServerError("Adding a reservation", error) };
	}
}

/** Ticks a reservation paid (cash or transfer), or takes the tick back. */
export async function setReservationPaidAction(id: string, paid: boolean): Promise<Result> {
	await requireUser();
	try {
		const [row] = await db
			.update(bookingRequests)
			.set({ paidAt: paid ? new Date() : null })
			.where(and(eq(bookingRequests.id, id), sql`${bookingRequests.sessionId} is not null`))
			.returning({ sessionId: bookingRequests.sessionId });
		if (!row) return { error: "This reservation no longer exists." };
		const [session] = await db.select({ googleEventId: studioSessions.googleEventId }).from(studioSessions).where(eq(studioSessions.id, row.sessionId!));
		if (session) refresh(session.googleEventId);
		return { success: true };
	} catch (error) {
		return { error: "Couldn't change it", ref: logServerError("Ticking a reservation paid", error) };
	}
}
