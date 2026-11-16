// Outdoor sessions as events, for the public API and the dashboard's rules.
// A plain server module: none of this is an endpoint by itself.

import { isListed, type Places,places } from "@/lib/domain/events/rules";
import { db } from "@/services/database";
import { bookingRequests, sessionPhotos, studioSessions } from "@/services/database/schema";

import { and, eq, inArray, isNotNull, or, sum } from "drizzle-orm";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** People confirmed for an outdoor session (a booking for three counts three). */
export async function confirmedPeople(sessionId: string, tx: Tx | typeof db = db): Promise<number> {
	const [row] = await tx
		.select({ people: sum(bookingRequests.partySize) })
		.from(bookingRequests)
		.where(and(eq(bookingRequests.sessionId, sessionId), eq(bookingRequests.status, "confirmed")));
	return Number(row?.people ?? 0);
}

/** People confirmed per session, for a list of sessions. */
export async function confirmedPeopleBySession(sessionIds: string[]): Promise<Map<string, number>> {
	if (!sessionIds.length) return new Map();
	const rows = await db
		.select({ sessionId: bookingRequests.sessionId, people: sum(bookingRequests.partySize) })
		.from(bookingRequests)
		.where(and(inArray(bookingRequests.sessionId, sessionIds), eq(bookingRequests.status, "confirmed")))
		.groupBy(bookingRequests.sessionId);
	return new Map(rows.map((r) => [r.sessionId!, Number(r.people ?? 0)]));
}

/** Locks the session's row until the transaction ends, so two confirmations can't both take the last place. */
export async function lockSession(tx: Tx, sessionId: string) {
	const [session] = await tx.select().from(studioSessions).where(eq(studioSessions.id, sessionId)).for("update");
	return session ?? null;
}

/** An outdoor session the website can take bookings for, by its address: on the website and still scheduled. */
export async function listedSessionBySlug(slug: string) {
	const [session] = await db
		.select()
		.from(studioSessions)
		.where(and(eq(studioSessions.slug, slug), eq(studioSessions.type, "outdoor"), eq(studioSessions.status, "scheduled")));
	return session && isListed(session) ? session : null;
}

/** Live places of the website's outdoor sessions, by address (unknown, hidden and cancelled ones are left out). */
export async function placesBySlug(slugs: string[]): Promise<Record<string, Places>> {
	if (!slugs.length) return {};
	const rows = (
		await db
			.select()
			.from(studioSessions)
			.where(and(inArray(studioSessions.slug, slugs), eq(studioSessions.type, "outdoor"), eq(studioSessions.status, "scheduled")))
	).filter(isListed);
	const people = await confirmedPeopleBySession(rows.map((r) => r.id));
	return Object.fromEntries(rows.map((r) => [r.slug!, places(r.capacity, people.get(r.id) ?? 0)]));
}

/** A session's photo, for sessions the website shows (on it, or cancelled after it showed them). */
export async function publicPhotoBySlug(slug: string) {
	const [row] = await db
		.select({ session: studioSessions, mime: sessionPhotos.mime, data: sessionPhotos.data, updatedAt: sessionPhotos.updatedAt })
		.from(sessionPhotos)
		.innerJoin(studioSessions, eq(studioSessions.id, sessionPhotos.sessionId))
		.where(
			and(
				eq(studioSessions.slug, slug),
				eq(studioSessions.type, "outdoor"),
				or(eq(studioSessions.status, "scheduled"), isNotNull(studioSessions.publishedAt)),
			),
		);
	return row && isListed(row.session) ? row : null;
}

/** Every outdoor session with when its photo changed, for the website's data. */
export async function outdoorSessionsForSite() {
	const rows = await db
		.select({ session: studioSessions, photoUpdatedAt: sessionPhotos.updatedAt })
		.from(studioSessions)
		.leftJoin(sessionPhotos, eq(sessionPhotos.sessionId, studioSessions.id))
		.where(eq(studioSessions.type, "outdoor"));
	return rows.map(({ session, photoUpdatedAt }) => ({ ...session, photoUpdatedAt }));
}
