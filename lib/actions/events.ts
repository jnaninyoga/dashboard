"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import {
	canTake,
	capacityProblem,
	eventProblems,
	type Places,
	places,
	slugify,
	uniqueSlug,
} from "@/lib/domain/events/rules";
import { logServerError } from "@/lib/errors/server";
import { type CalendarOutcome, cancelEventInCalendar, syncEventToCalendar } from "@/lib/events/calendar";
import { confirmedPeople, confirmedPeopleByEvent, lockEvent } from "@/lib/events/store";
import { fromStudioTime } from "@/lib/utils/time";
import { eventSchema, reservationSchema } from "@/lib/validators/event";
import { type RebuildOutcome, requestSiteRebuild } from "@/lib/website/rebuild";
import { db } from "@/services/database";
import { type BookingRequest, bookingRequests, type Event, eventPhotos, events } from "@/services/database/schema";

import { and, desc, eq, ne, sql } from "drizzle-orm";

type Result = { success?: true; error?: string; ref?: string; id?: string; website?: RebuildOutcome; calendar?: CalendarOutcome };

export type EventListItem = Event & { places: Places; reservations: number; hasPhoto: boolean; photoVersion: number | null };
export type EventDetail = Event & { places: Places; hasPhoto: boolean; photoVersion: number | null; reservations: BookingRequest[] };

function refresh(id?: string) {
	revalidatePath("/website/events");
	if (id) revalidatePath(`/website/events/${id}`);
	revalidatePath("/bookings");
}

/** Her events, the next first, with places and how many reservations each has. */
export async function getEvents(): Promise<{ data?: EventListItem[]; error?: string; ref?: string }> {
	await requireUser();
	try {
		const rows = await db
			.select({
				event: events,
				reservations: sql<number>`(select count(*)::int from ${bookingRequests} where ${bookingRequests.eventId} = ${events.id} and ${bookingRequests.status} <> 'declined')`,
				photoUpdatedAt: eventPhotos.updatedAt,
			})
			.from(events)
			.leftJoin(eventPhotos, eq(eventPhotos.eventId, events.id))
			.orderBy(desc(events.startsAt));
		const people = await confirmedPeopleByEvent(rows.map((r) => r.event.id));
		return {
			data: rows.map(({ event, reservations, photoUpdatedAt }) => ({
				...event,
				places: places(event.capacity, people.get(event.id) ?? 0),
				reservations,
				hasPhoto: photoUpdatedAt !== null,
				photoVersion: photoUpdatedAt ? photoUpdatedAt.getTime() : null,
			})),
		};
	} catch (error) {
		return { error: "Couldn't load the events", ref: logServerError("Loading events", error) };
	}
}

/** One event with its reservations (newest first) and its places. */
export async function getEvent(id: string): Promise<{ data?: EventDetail | null; error?: string; ref?: string }> {
	await requireUser();
	if (!/^[0-9a-f-]{36}$/i.test(id)) return { data: null };
	try {
		const [event] = await db.select().from(events).where(eq(events.id, id));
		if (!event) return { data: null };
		const [reservations, people, [photo]] = await Promise.all([
			db.select().from(bookingRequests).where(eq(bookingRequests.eventId, id)).orderBy(desc(bookingRequests.createdAt)),
			confirmedPeople(id),
			db.select({ updatedAt: eventPhotos.updatedAt }).from(eventPhotos).where(eq(eventPhotos.eventId, id)),
		]);
		return {
			data: {
				...event,
				places: places(event.capacity, people),
				hasPhoto: !!photo,
				photoVersion: photo ? photo.updatedAt.getTime() : null,
				reservations,
			},
		};
	} catch (error) {
		return { error: "Couldn't load this event", ref: logServerError("Loading an event", error) };
	}
}

/**
 * Saves an event (`id` null: a new one), as a draft or published. Its
 * address comes from the French title and stays fixed once published, since
 * it may already have been shared. A published event rebuilds the website
 * and goes into her calendar.
 */
export async function saveEventAction(id: string | null, data: unknown, publish: boolean): Promise<Result> {
	const user = await requireUser();
	const parsed = eventSchema.safeParse(data);
	if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the event" };
	const v = parsed.data;
	const startsAt = fromStudioTime(v.startDate, v.startTime);
	const endsAt = fromStudioTime(v.endDate, v.endTime);
	const capacity = v.limited ? v.capacity : null;
	const problems = eventProblems({ ...v, startsAt, endsAt, capacity });
	if (problems.length) return { error: problems[0] };

	let saved: Event;
	try {
		saved = await db.transaction(async (tx) => {
			const before = id ? await lockEvent(tx, id) : null;
			if (id && !before) throw new EventError("This event no longer exists.");
			if (before) {
				const problem = capacityProblem(capacity, await confirmedPeople(before.id, tx));
				if (problem) throw new EventError(problem);
			}
			const fixedSlug = before?.publishedAt ? before.slug : null;
			const slug =
				fixedSlug ??
				uniqueSlug(
					slugify(v.titleFr),
					(await tx.select({ slug: events.slug }).from(events).where(id ? ne(events.id, id) : undefined)).map((e) => e.slug),
				);
			const status = before?.status === "cancelled" ? "cancelled" : publish || before?.status === "published" ? "published" : "draft";
			const row = {
				slug,
				titleFr: v.titleFr,
				titleEn: v.titleEn || null,
				descriptionFr: v.descriptionFr,
				descriptionEn: v.descriptionEn || null,
				startsAt,
				endsAt,
				placeName: v.placeName,
				placeMapsUrl: v.placeMapsUrl || null,
				price: v.price.toFixed(2),
				capacity,
				status,
				publishedAt: before?.publishedAt ?? (status === "published" ? new Date() : null),
				updatedAt: new Date(),
			} as const;
			const [result] = id
				? await tx.update(events).set(row).where(eq(events.id, id)).returning()
				: await tx.insert(events).values(row).returning();
			return result;
		});
	} catch (error) {
		if (error instanceof EventError) return { error: error.message };
		return { error: "Couldn't save the event", ref: logServerError("Saving an event", error) };
	}

	refresh(saved.id);
	if (saved.status !== "published") return { success: true, id: saved.id };
	const [website, calendar] = await Promise.all([requestSiteRebuild("an event"), syncEventToCalendar(user.id, saved)]);
	return { success: true, id: saved.id, website, calendar };
}

class EventError extends Error {}

/** Tries her calendar again for a published event that isn't in it yet. */
export async function syncEventCalendarAction(id: string): Promise<Result> {
	const user = await requireUser();
	const [event] = await db.select().from(events).where(eq(events.id, id));
	if (!event || event.status !== "published") return { error: "Only a published event goes in your calendar." };
	const calendar = await syncEventToCalendar(user.id, event);
	refresh(id);
	return calendar === "synced" ? { success: true, calendar } : { error: "Google Calendar didn't answer. Try again in a moment." };
}

/** Cancels an event: the site marks it cancelled (its page stays), her calendar frees the time, the list stays so she can tell everyone. */
export async function cancelEventAction(id: string, reason: string): Promise<Result> {
	const user = await requireUser();
	const why = reason.trim().slice(0, 300);
	if (!why) return { error: "Say why, in a few words: it's kept with the event." };
	try {
		const [event] = await db
			.update(events)
			.set({ status: "cancelled", cancelledAt: new Date(), cancelReason: why, updatedAt: new Date() })
			.where(and(eq(events.id, id), ne(events.status, "cancelled")))
			.returning();
		if (!event) return { error: "This event is already cancelled, or no longer exists." };
		refresh(id);
		if (!event.publishedAt) return { success: true };
		const [website, calendar] = await Promise.all([requestSiteRebuild("a cancelled event"), cancelEventInCalendar(user.id, event, why)]);
		return { success: true, website, calendar };
	} catch (error) {
		return { error: "Couldn't cancel the event", ref: logServerError("Cancelling an event", error) };
	}
}

const PHOTO_TYPES = ["image/webp", "image/jpeg", "image/png"];
const MAX_PHOTO = 1_500_000;

/** Saves the event's photo (already resized in her browser). */
export async function uploadEventPhotoAction(id: string, form: FormData): Promise<Result> {
	await requireUser();
	const file = form.get("photo");
	if (!(file instanceof File) || !file.size) return { error: "Choose a photo." };
	if (!PHOTO_TYPES.includes(file.type)) return { error: "A photo in JPEG, PNG or WebP." };
	if (file.size > MAX_PHOTO) return { error: "This photo is too big, even resized. Try another." };
	try {
		const [event] = await db.select({ id: events.id, status: events.status }).from(events).where(eq(events.id, id));
		if (!event) return { error: "This event no longer exists." };
		const data = Buffer.from(await file.arrayBuffer());
		await db
			.insert(eventPhotos)
			.values({ eventId: id, mime: file.type, data, updatedAt: new Date() })
			.onConflictDoUpdate({ target: eventPhotos.eventId, set: { mime: file.type, data, updatedAt: new Date() } });
		refresh(id);
		return { success: true, website: event.status === "published" ? await requestSiteRebuild("an event's photo") : undefined };
	} catch (error) {
		return { error: "Couldn't save the photo", ref: logServerError("Saving an event photo", error) };
	}
}

/**
 * A reservation she takes outside the website (WhatsApp, phone, in person):
 * saved as confirmed, so it takes its places, never past the limit.
 */
export async function addReservationAction(eventId: string, data: unknown): Promise<Result> {
	await requireUser();
	const parsed = reservationSchema.safeParse(data);
	if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the reservation" };
	const r = parsed.data;
	try {
		await db.transaction(async (tx) => {
			const event = await lockEvent(tx, eventId);
			if (!event) throw new EventError("This event no longer exists.");
			if (event.status === "cancelled") throw new EventError("This event is cancelled.");
			const taken = await confirmedPeople(eventId, tx);
			if (!canTake(event.capacity, taken, r.partySize)) {
				throw new EventError(`Full: ${taken} of ${event.capacity} places confirmed. Raise the limit to add ${r.partySize === 1 ? "someone" : "this group"}.`);
			}
			await tx.insert(bookingRequests).values({
				kind: "event",
				eventId,
				choiceKey: event.slug,
				choiceLabel: event.titleFr,
				name: r.name,
				phone: r.phone,
				partySize: r.partySize,
				source: r.source,
				clientId: r.clientId,
				status: "confirmed",
				statusChangedAt: new Date(),
			});
		});
		refresh(eventId);
		return { success: true };
	} catch (error) {
		if (error instanceof EventError) return { error: error.message };
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
			.where(and(eq(bookingRequests.id, id), sql`${bookingRequests.eventId} is not null`))
			.returning({ eventId: bookingRequests.eventId });
		if (!row) return { error: "This reservation no longer exists." };
		refresh(row.eventId ?? undefined);
		return { success: true };
	} catch (error) {
		return { error: "Couldn't change it", ref: logServerError("Ticking a reservation paid", error) };
	}
}
