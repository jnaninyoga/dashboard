import { requireUser } from "@/lib/auth/require-user";
import { type FeedSession, mergeFeed } from "@/lib/domain/schedule/feed";
import { addDays, studioDaysRange } from "@/lib/utils/time";
import { db } from "@/services/database";
import { attendanceLedger, studioSessions } from "@/services/database/schema";
import { getEventsBetween, type GoogleResult, withGoogle } from "@/services/google";

import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";

/**
 * The sessions of a run of studio days ("YYYY-MM-DD", inclusive), for the
 * Schedule and the week on Home: one Google Calendar request for the whole
 * range, plus her cancelled sessions and the check-in counts from our records.
 */
export async function getSessionFeed(first: string, last: string): Promise<GoogleResult<FeedSession[]>> {
	const user = await requireUser();
	const { start, end } = studioDaysRange(first, last);

	const google = await withGoogle(user.id, "Google Calendar", (token) => getEventsBetween(token, start, end));
	if (google.error !== undefined) return { error: google.error };

	const cancelled = await db
		.select({
			googleEventId: studioSessions.googleEventId,
			title: studioSessions.title,
			type: studioSessions.type,
			startsAt: studioSessions.startsAt,
			endsAt: studioSessions.endsAt,
			cancelReason: studioSessions.cancelReason,
		})
		.from(studioSessions)
		.where(
			and(
				eq(studioSessions.status, "cancelled"),
				gte(studioSessions.startsAt, start),
				lt(studioSessions.startsAt, end),
			),
		);

	const ids = [...google.data.flatMap((event) => (event.id ? [event.id] : [])), ...cancelled.map((s) => s.googleEventId)];
	const counts = ids.length
		? await db
				.select({
					id: attendanceLedger.googleEventId,
					live: sql<number>`count(*) filter (where ${attendanceLedger.cancelledAt} is null)`.mapWith(Number),
					cancelled: sql<number>`count(*) filter (where ${attendanceLedger.cancelledAt} is not null)`.mapWith(Number),
				})
				.from(attendanceLedger)
				.where(inArray(attendanceLedger.googleEventId, ids))
				.groupBy(attendanceLedger.googleEventId)
		: [];

	const days: string[] = [];
	for (let day = first; day <= last; day = addDays(day, 1)) days.push(day);

	return {
		data: mergeFeed({
			days,
			events: google.data,
			cancelled,
			checkIns: new Map(counts.flatMap((c) => (c.id ? [[c.id, { live: c.live, cancelled: c.cancelled }] as const] : []))),
		}),
	};
}

/** Our record of a session (the history of one Google Calendar no longer has). */
export async function getStudioSession(googleEventId: string) {
	await requireUser();
	const [session] = await db.select().from(studioSessions).where(eq(studioSessions.googleEventId, googleEventId));
	return session ?? null;
}
