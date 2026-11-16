// An outdoor event in her Google Calendar, so it shows in Schedule and on
// the home week and blocks the time. Best effort: the website never waits
// on Google, and a failure is reported so she can retry.

import { logServerError } from "@/lib/errors/server";
import { STUDIO_TIME_ZONE, toStudioTime } from "@/lib/utils/time";
import { db } from "@/services/database";
import { type Event, events, studioSessions } from "@/services/database/schema";
import { cancelStudioEvent, createStudioEvent, getValidAccessToken, updateStudioEvent } from "@/services/google";

import { eq } from "drizzle-orm";

export type CalendarOutcome = "synced" | "failed";

const pad = (n: number) => String(n).padStart(2, "0");
/** An instant as the studio's wall clock, "YYYY-MM-DDTHH:mm:00", for Google with the studio's zone. */
const wallClock = (instant: Date) => {
	const t = toStudioTime(instant);
	return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}:00`;
};

/** Puts the event in her calendar, or moves it there when its date or title changed. */
export async function syncEventToCalendar(userId: string, event: Event): Promise<CalendarOutcome> {
	try {
		const token = await getValidAccessToken(userId);
		const times = { title: event.titleFr, startTime: wallClock(event.startsAt), endTime: wallClock(event.endsAt), timeZone: STUDIO_TIME_ZONE };
		if (event.googleEventId) {
			await updateStudioEvent(token, event.googleEventId, times);
			await db
				.update(studioSessions)
				.set({ title: event.titleFr, startsAt: event.startsAt, endsAt: event.endsAt })
				.where(eq(studioSessions.googleEventId, event.googleEventId));
			return "synced";
		}
		const created = await createStudioEvent(token, { ...times, type: "outdoor", outdoorPrice: Number(event.price) });
		await db.transaction(async (tx) => {
			await tx.update(events).set({ googleEventId: created.id! }).where(eq(events.id, event.id));
			await tx.insert(studioSessions).values({
				googleEventId: created.id!,
				title: event.titleFr,
				type: "outdoor",
				startsAt: event.startsAt,
				endsAt: event.endsAt,
			});
		});
		return "synced";
	} catch (error) {
		logServerError("Putting an event in Google Calendar", error);
		return "failed";
	}
}

/** Takes a cancelled event out of her calendar, keeping its session in history as cancelled. */
export async function cancelEventInCalendar(userId: string, event: Event, reason: string): Promise<CalendarOutcome> {
	if (!event.googleEventId) return "synced";
	try {
		const token = await getValidAccessToken(userId);
		await cancelStudioEvent(token, event.googleEventId);
		await db
			.update(studioSessions)
			.set({ status: "cancelled", cancelledAt: new Date(), cancelReason: reason })
			.where(eq(studioSessions.googleEventId, event.googleEventId));
		return "synced";
	} catch (error) {
		logServerError("Taking an event out of Google Calendar", error);
		return "failed";
	}
}
