// Reading events for the public API and the dashboard's rules. A plain
// server module: none of this is an endpoint by itself.

import { type Places,places } from "@/lib/domain/events/rules";
import { db } from "@/services/database";
import { bookingRequests, eventPhotos, events } from "@/services/database/schema";

import { and, eq, inArray, isNotNull, or, sql, sum } from "drizzle-orm";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** People confirmed for an event (a booking for three counts three). */
export async function confirmedPeople(eventId: string, tx: Tx | typeof db = db): Promise<number> {
	const [row] = await tx
		.select({ people: sum(bookingRequests.partySize) })
		.from(bookingRequests)
		.where(and(eq(bookingRequests.eventId, eventId), eq(bookingRequests.status, "confirmed")));
	return Number(row?.people ?? 0);
}

/** People confirmed per event, for a list of events. */
export async function confirmedPeopleByEvent(eventIds: string[]): Promise<Map<string, number>> {
	if (!eventIds.length) return new Map();
	const rows = await db
		.select({ eventId: bookingRequests.eventId, people: sum(bookingRequests.partySize) })
		.from(bookingRequests)
		.where(and(inArray(bookingRequests.eventId, eventIds), eq(bookingRequests.status, "confirmed")))
		.groupBy(bookingRequests.eventId);
	return new Map(rows.map((r) => [r.eventId!, Number(r.people ?? 0)]));
}

/** Locks the event's row until the transaction ends, so two confirmations can't both take the last place. */
export async function lockEvent(tx: Tx, eventId: string) {
	const [event] = await tx.select().from(events).where(eq(events.id, eventId)).for("update");
	return event ?? null;
}

/** A published event the website can take bookings for, by its address. */
export async function publishedEventBySlug(slug: string) {
	const [event] = await db
		.select()
		.from(events)
		.where(and(eq(events.slug, slug), eq(events.status, "published")));
	return event ?? null;
}

/** Live places of published events, by address (unknown and draft addresses are left out). */
export async function placesBySlug(slugs: string[]): Promise<Record<string, Places>> {
	if (!slugs.length) return {};
	const rows = await db
		.select({ id: events.id, slug: events.slug, capacity: events.capacity })
		.from(events)
		.where(and(inArray(events.slug, slugs), eq(events.status, "published")));
	const people = await confirmedPeopleByEvent(rows.map((r) => r.id));
	return Object.fromEntries(rows.map((r) => [r.slug, places(r.capacity, people.get(r.id) ?? 0)]));
}

/** An event's photo, for events the website shows (published, or cancelled after being published). */
export async function publicPhotoBySlug(slug: string) {
	const [row] = await db
		.select({ mime: eventPhotos.mime, data: eventPhotos.data, updatedAt: eventPhotos.updatedAt })
		.from(eventPhotos)
		.innerJoin(events, eq(events.id, eventPhotos.eventId))
		.where(and(eq(events.slug, slug), or(eq(events.status, "published"), and(eq(events.status, "cancelled"), isNotNull(events.publishedAt)))));
	return row ?? null;
}

/** Every event with whether it has a photo, for the site's data. */
export async function eventsWithPhotoFlag() {
	return db
		.select({
			id: events.id,
			slug: events.slug,
			titleFr: events.titleFr,
			titleEn: events.titleEn,
			descriptionFr: events.descriptionFr,
			descriptionEn: events.descriptionEn,
			startsAt: events.startsAt,
			endsAt: events.endsAt,
			placeName: events.placeName,
			placeMapsUrl: events.placeMapsUrl,
			price: events.price,
			capacity: events.capacity,
			status: events.status,
			publishedAt: events.publishedAt,
			hasPhoto: sql<boolean>`exists (select 1 from ${eventPhotos} where ${eventPhotos.eventId} = ${events.id})`,
		})
		.from(events);
}
