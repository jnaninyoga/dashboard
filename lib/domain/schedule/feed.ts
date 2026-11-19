// One list of sessions for a run of studio days: Google Calendar's events
// (every event in her calendar, not only the dashboard's), the sessions she
// cancelled, which Google no longer has, and the outdoor sessions deleted in
// Google Calendar itself, which the website may still show. Kept apart from
// the database and Google calls so the rules are tested on their own.

import { type CalendarEvent } from "@/lib/types";
import { fromStudioTime, studioDateString, toStudioTime, wallClockOf } from "@/lib/utils/time";
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
	/** Start and end on the studio's clock ("HH:mm"); null for an all-day event. */
	startTime: string | null;
	endTime: string | null;
	status: "scheduled" | "cancelled";
	/** Made outside the dashboard (no studio type): shown, but not a class to check into. */
	external: boolean;
	/** Clients who came (check-ins of a cancelled session don't count). */
	checkIns: number;
	/** Credits given back when the session was cancelled. */
	refunded: number;
	cancelReason: string | null;
	/** Google's event, for a live session (guests, colours, actions); null once cancelled or gone. */
	event: CalendarEvent | null;
	/** An outdoor session deleted in Google Calendar itself: still ours, and maybe still on the website. */
	notInCalendar: boolean;
	/** Shown on the website (only known for a session not in her calendar). */
	onWebsite: boolean;
};

/** An outdoor session her calendar no longer has, from our record. */
export type MissingSession = Pick<StudioSession, "googleEventId" | "title" | "type" | "startsAt" | "endsAt"> & { onWebsite: boolean };

const TYPES: readonly string[] = ["group", "private", "outdoor", "b2b"];

const pad = (n: number) => String(n).padStart(2, "0");
/** "HH:mm" of an instant on the studio's clock, from our own zone data (our records only). */
const clockOf = (instant: Date) => {
	const t = toStudioTime(instant);
	return `${pad(t.getHours())}:${pad(t.getMinutes())}`;
};

/** An event's start or end as an instant; an all-day event starts at the studio's midnight. */
export function instantOf(time: CalendarEvent["start"]): Date | null {
	if (time?.dateTime) return new Date(time.dateTime);
	if (time?.date) return fromStudioTime(time.date, "00:00");
	return null;
}

/** What a session from our records shows, Google having no event for it. */
const fromRecord = (session: Pick<StudioSession, "googleEventId" | "title" | "type" | "startsAt" | "endsAt">) => ({
	id: session.googleEventId,
	title: session.title,
	type: session.type,
	start: session.startsAt.toISOString(),
	end: session.endsAt.toISOString(),
	day: studioDateString(session.startsAt),
	startTime: clockOf(session.startsAt),
	endTime: clockOf(session.endsAt),
	external: false,
	event: null,
});

export function mergeFeed({
	days,
	events,
	cancelled,
	missing = [],
	checkIns,
}: {
	/** The studio days wanted, in order. */
	days: string[];
	events: CalendarEvent[];
	cancelled: Pick<StudioSession, "googleEventId" | "title" | "type" | "startsAt" | "endsAt" | "cancelReason">[];
	missing?: MissingSession[];
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
		// Google's own wall clock (we ask for the studio's zone): always current.
		const startWall = wallClockOf(event.start?.dateTime);
		const endWall = wallClockOf(event.end?.dateTime);
		sessions.set(event.id, {
			id: event.id,
			title: event.summary || "Session",
			type: studioType ?? "group",
			start: start.toISOString(),
			end: end.toISOString(),
			day: startWall?.date ?? event.start?.date ?? studioDateString(start),
			startTime: startWall?.time ?? null,
			endTime: endWall?.time ?? null,
			status: "scheduled",
			external: !studioType,
			checkIns: checkIns.get(event.id)?.live ?? 0,
			refunded: 0,
			cancelReason: null,
			event,
			notInCalendar: false,
			onWebsite: false,
		});
	}

	// Gone from her calendar, still ours: shown so she can put it back or cancel it.
	for (const session of missing) {
		if (sessions.has(session.googleEventId)) continue;
		sessions.set(session.googleEventId, {
			...fromRecord(session),
			status: "scheduled",
			checkIns: checkIns.get(session.googleEventId)?.live ?? 0,
			refunded: 0,
			cancelReason: null,
			notInCalendar: true,
			onWebsite: session.onWebsite,
		});
	}

	// Our record wins: a cancelled session is cancelled, whatever Google still shows.
	for (const session of cancelled) {
		sessions.set(session.googleEventId, {
			...fromRecord(session),
			status: "cancelled",
			checkIns: 0,
			refunded: checkIns.get(session.googleEventId)?.cancelled ?? 0,
			cancelReason: session.cancelReason,
			notInCalendar: false,
			onWebsite: false,
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
