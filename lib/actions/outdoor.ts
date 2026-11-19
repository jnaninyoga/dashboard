"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { canTake, capacityProblem, eventProblems, isListed, type Places, places, slugify, uniqueSlug } from "@/lib/domain/events/rules";
import { logServerError } from "@/lib/errors/server";
import { checkOutdoorSession } from "@/lib/events/calendar-sync";
import { confirmedPeople, lockSession } from "@/lib/events/store";
import { fromStudioTime, STUDIO_TIME_ZONE } from "@/lib/utils/time";
import { eventSchema, reservationSchema } from "@/lib/validators/event";
import { type RebuildOutcome, requestSiteRebuild } from "@/lib/website/rebuild";
import { db } from "@/services/database";
import { attendanceLedger, type BookingRequest, bookingRequests, sessionPhotos, type StudioSession, studioSessions } from "@/services/database/schema";
import { cancelStudioEvent, createStudioEvent, getEventById, getValidAccessToken, googleErrorMessage, updateStudioEvent } from "@/services/google";

import { and, desc, eq, isNotNull, sql } from "drizzle-orm";

type Result = { success?: true; error?: string; ref?: string; website?: RebuildOutcome };

/**
 * An outdoor session with what its page shows: its places, its photo, who's
 * coming, and whether her Google Calendar still has it.
 */
export type OutdoorSession = StudioSession & {
	places: Places;
	hasPhoto: boolean;
	photoVersion: number | null;
	reservations: BookingRequest[];
	calendar: "ok" | "missing" | "unknown";
};

class Refused extends Error {}

function refresh(googleEventId: string) {
	revalidatePath(`/schedule/outdoor/${googleEventId}`);
	revalidatePath("/schedule");
	revalidatePath("/bookings");
}

/**
 * An outdoor session by its Google Calendar id, as the Schedule knows it.
 * Null when it isn't an outdoor session the dashboard created (one made in
 * Google Calendar itself has no record to hold its website part). Moved or
 * renamed in her calendar, it follows on the way.
 */
export async function getOutdoorSession(googleEventId: string): Promise<{ data?: OutdoorSession | null; error?: string; ref?: string }> {
	const user = await requireUser();
	try {
		const [row] = await db
			.select()
			.from(studioSessions)
			.where(and(eq(studioSessions.googleEventId, googleEventId), eq(studioSessions.type, "outdoor")));
		if (!row) return { data: null };
		const [{ row: session, calendar }, reservations, people, [photo]] = await Promise.all([
			checkOutdoorSession(user.id, row),
			db.select().from(bookingRequests).where(eq(bookingRequests.sessionId, row.id)).orderBy(desc(bookingRequests.createdAt)),
			confirmedPeople(row.id),
			db.select({ updatedAt: sessionPhotos.updatedAt }).from(sessionPhotos).where(eq(sessionPhotos.sessionId, row.id)),
		]);
		return {
			data: {
				...session,
				calendar,
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
			// Times go to Google only when she changed them, as she typed them (like a new session):
			// re-deriving them from the stored instant would move the event on a server whose
			// time-zone data is out of date.
			const timesChanged = before.startsAt.getTime() !== startsAt.getTime() || before.endsAt.getTime() !== endsAt.getTime();
			const calendarChanged = before.title !== v.title || timesChanged || Number(before.price ?? NaN) !== v.price;
			let times = { startsAt: before.startsAt, endsAt: before.endsAt };
			if (calendarChanged) {
				try {
					const token = await getValidAccessToken(user.id);
					const updated = await updateStudioEvent(token, before.googleEventId, {
						title: v.title,
						timeZone: STUDIO_TIME_ZONE,
						outdoorPrice: v.price,
						...(timesChanged ? { startTime: `${v.date}T${v.startTime}:00`, endTime: `${v.date}T${v.endTime}:00` } : {}),
					});
					// Google places the new times with its own, always current, zone data.
					if (timesChanged) {
						times = {
							startsAt: updated.start?.dateTime ? new Date(updated.start.dateTime) : startsAt,
							endsAt: updated.end?.dateTime ? new Date(updated.end.dateTime) : endsAt,
						};
					}
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
					...times,
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

/**
 * Puts an outdoor session deleted in Google Calendar itself back in her
 * calendar, as it was: same title, times and price. Its bookings, photo and
 * website part stay with it; only its calendar id changes, so its page moves.
 */
export async function restoreOutdoorEventAction(sessionId: string): Promise<Result & { googleEventId?: string }> {
	const user = await requireUser();
	let token: string;
	try {
		token = await getValidAccessToken(user.id);
	} catch (error) {
		return { error: googleErrorMessage(error, "Google Calendar") };
	}

	let created: string | null = null;
	try {
		const googleEventId = await db.transaction(async (tx) => {
			const row = await lockSession(tx, sessionId);
			if (!row || row.type !== "outdoor") throw new Refused("This outdoor session no longer exists.");
			if (row.status === "cancelled") throw new Refused("This session is cancelled.");
			let current;
			try {
				current = await getEventById(token, row.googleEventId);
			} catch (error) {
				throw new Refused(googleErrorMessage(error, "Google Calendar"));
			}
			// Already back (put back on another tab, or restored from Google's bin).
			if (current && current.status !== "cancelled") return row.googleEventId;

			let event;
			try {
				event = await createStudioEvent(token, {
					title: row.title,
					// The stored instants, offset included: Google places them exactly, whatever
					// time-zone data this server has, and shows them in the studio's zone.
					startTime: row.startsAt.toISOString(),
					endTime: row.endsAt.toISOString(),
					timeZone: STUDIO_TIME_ZONE,
					type: "outdoor",
					outdoorPrice: row.price != null ? Number(row.price) : null,
				});
			} catch (error) {
				throw new Refused(googleErrorMessage(error, "Google Calendar"));
			}
			created = event.id!;
			await tx.update(studioSessions).set({ googleEventId: created }).where(eq(studioSessions.id, row.id));
			await tx.update(attendanceLedger).set({ googleEventId: created }).where(eq(attendanceLedger.googleEventId, row.googleEventId));
			return created;
		});
		revalidatePath("/schedule");
		revalidatePath("/");
		return { success: true, googleEventId };
	} catch (error) {
		// Our records didn't follow: take the new event back out, so it isn't there twice.
		if (created) {
			await cancelStudioEvent(token, created).catch((undo) => logServerError("Couldn't remove an unrecorded restored session from Google Calendar", undo));
		}
		if (error instanceof Refused) return { error: error.message };
		return { error: "Couldn't put the session back in your calendar", ref: logServerError("Restoring an outdoor session to Google Calendar", error) };
	}
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
