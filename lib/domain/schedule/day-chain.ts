// Small helpers for a day's periods: times as minutes, order, lengths, the
// rests between them, and the next period she adds.

import { type Period } from "./hours";

const LAST_MINUTE = 23 * 60 + 59;

export const toMinutes = (time: string) => {
	const [h, m] = time.split(":").map(Number);
	return h * 60 + m;
};

/** Minutes after midnight as "HH:mm", kept inside the day. */
export const toTime = (minutes: number) => {
	const m = Math.min(Math.max(Math.round(minutes), 0), LAST_MINUTE);
	return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

/** The periods by start time. */
export const inOrder = (periods: readonly Period[]) => [...periods].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

export const lengthOf = (p: Period) => toMinutes(p.end) - toMinutes(p.start);

/** The rest after each period but the last, in minutes (negative when two overlap). */
export const restsOf = (periods: readonly Period[]) => periods.slice(1).map((p, i) => toMinutes(p.start) - toMinutes(periods[i].end));

/** One more period after the last, with the same rest and length as the one before (30 min and 1h30 to begin with). */
export function addPeriod(periods: readonly Period[]): Period[] {
	const last = periods.at(-1);
	if (!last) return [{ start: "09:00", end: "10:30" }];
	const rest = Math.max(0, restsOf(periods).at(-1) ?? 30);
	const start = toMinutes(last.end) + rest;
	return [...periods, { start: toTime(start), end: toTime(start + lengthOf(last)) }];
}

/** "1h30", "2h", "45 min". */
export function showLength(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	if (!h) return `${m} min`;
	return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

/** "08:30" as people write it: "8:30". */
export const showTime = (time: string) => time.replace(/^0(\d)/, "$1");
