// An outdoor session lives twice: as the event in her Google Calendar, which
// says when it is, and as our row, which the website reads. When she moves,
// renames or deletes it in Google Calendar itself, the row has to follow, or
// the website keeps the old day and takes bookings for it.

import { instantOf } from "@/lib/domain/schedule/feed";
import { type CalendarEvent } from "@/lib/types";

type Row = { title: string; startsAt: Date; endsAt: Date };

export type CalendarCheck =
	| { kind: "same" }
	/** Moved or renamed in her calendar: what the row becomes. */
	| { kind: "changed"; set: Row }
	/** Deleted in her calendar. Never acted on alone: she puts it back or cancels it. */
	| { kind: "gone" };

/** What her calendar says about a session: unchanged, moved or renamed, or deleted. */
export function calendarCheck(row: Row, event: CalendarEvent | null): CalendarCheck {
	if (!event || event.status === "cancelled") return { kind: "gone" };
	const set = {
		title: event.summary?.trim() || row.title,
		startsAt: instantOf(event.start) ?? row.startsAt,
		endsAt: instantOf(event.end) ?? row.endsAt,
	};
	const same =
		set.title === row.title && set.startsAt.getTime() === row.startsAt.getTime() && set.endsAt.getTime() === row.endsAt.getTime();
	return same ? { kind: "same" } : { kind: "changed", set };
}
