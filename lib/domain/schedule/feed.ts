// One list of sessions for a run of studio days: Google Calendar's events
// (every event in her calendar, not only the dashboard's) plus the sessions
// she cancelled, which Google no longer has. Kept apart from the database
// and Google calls so the rules are tested on their own.

import { type CalendarEvent } from "@/lib/types";
import { fromStudioTime, studioDateString } from "@/lib/utils/time";
import { type StudioSession } from "@/services/database/schema";

export type SessionType = StudioSession["type"];

export type FeedSession = {
	/** The Google event id. */
	id: string;
	title: string;
	type: SessionType;
	/** Instants, ISO. */
	start: string;
	end: string;
	/** The studio's calendar day ("YYYY-MM-DD") the session starts on. */
	day: string;
	status: "scheduled" | "cancelled";
	/** Made outside the dashboard (no studio type): shown, but not a class to check into. */
	external: boolean;
	/** Clients who came (check-ins of a cancelled session don't count). */
	checkIns: number;
	/** Credits given back when the session was cancelled. */
	refunded: number;
	cancelReason: string | null;
	/** Google's event, for a live session (guests, colours, actions); null once cancelled. */
	event: CalendarEvent | null;
};

const TYPES: readonly string[] = ["group", "private", "outdoor", "b2b"];

/** An event's start or end as an instant; an all-day event starts at the studio's midnight. */
function instantOf(time: CalendarEvent["start"]): Date | null {
	if (time?.dateTime) return new Date(time.dateTime);
	if (time?.date) return fromStudioTime(time.date, "00:00");
	return null;
}

export function mergeFeed({
	days,
	events,
	cancelled,
	checkIns,
}: {
	/** The studio days wanted, in order. */
	days: string[];
	events: CalendarEvent[];
	cancelled: Pick<StudioSession, "googleEventId" | "title" | "type" | "startsAt" | "endsAt" | "cancelReason">[];
	/** Check-ins per event: those that count, and those given back. */
	checkIns: Map<string, { live: number; cancelled: number }>;
}): FeedSession[] {
	const wanted = new Set(days);
	const sessions = new Map<string, FeedSession>();

	for (const event of events) {
		const start = instantOf(event.start);
		const end = instantOf(event.end) ?? start;
		if (!event.id || !start || !end) continue;
		const type = event.extendedProperties?.private?.jnaninEventType;
		const studioType = type && TYPES.includes(type) ? (type as SessionType) : null;
		sessions.set(event.id, {
			id: event.id,
			title: event.summary || "Session",
			type: studioType ?? "group",
			start: start.toISOString(),
			end: end.toISOString(),
			day: event.start?.date ?? studioDateString(start),
			status: "scheduled",
			external: !studioType,
			checkIns: checkIns.get(event.id)?.live ?? 0,
			refunded: 0,
			cancelReason: null,
			event,
		});
	}

	// Our record wins: a cancelled session is cancelled, whatever Google still shows.
	for (const session of cancelled) {
		sessions.set(session.googleEventId, {
			id: session.googleEventId,
			title: session.title,
			type: session.type,
			start: session.startsAt.toISOString(),
			end: session.endsAt.toISOString(),
			day: studioDateString(session.startsAt),
			status: "cancelled",
			external: false,
			checkIns: 0,
			refunded: checkIns.get(session.googleEventId)?.cancelled ?? 0,
			cancelReason: session.cancelReason,
			event: null,
		});
	}

	return [...sessions.values()]
		.filter((session) => wanted.has(session.day))
		.sort((a, b) => a.start.localeCompare(b.start));
}

/** What a day or a week holds: the sessions that happen, the cancelled ones, the clients who came. */
export function summarize(sessions: Pick<FeedSession, "status" | "checkIns">[]) {
	let live = 0;
	let cancelled = 0;
	let checkIns = 0;
	for (const session of sessions) {
		if (session.status === "cancelled") cancelled++;
		else {
			live++;
			checkIns += session.checkIns;
		}
	}
	return { sessions: live, cancelled, checkIns };
}

/** A day's sessions in words, the same on Home and in the Schedule. */
export function dayCountLabel({ sessions, cancelled }: { sessions: number; cancelled: number }) {
	const parts = [
		sessions ? `${sessions} ${sessions === 1 ? "session" : "sessions"}` : null,
		cancelled ? `${cancelled} cancelled` : null,
	].filter(Boolean);
	return parts.length ? parts.join(", ") : "No sessions";
}
