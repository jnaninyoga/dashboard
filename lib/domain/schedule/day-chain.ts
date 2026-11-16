// Her working day as she thinks of it: a period, a rest, a period, a rest…
// Changing a rest or a period's length moves the periods after it, so the
// other rests stay as they were.

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

/** Moves period `index` and every period after it by `delta` minutes. */
export function shiftFrom(periods: readonly Period[], index: number, delta: number): Period[] {
	return periods.map((p, i) =>
		i < index ? p : { start: toTime(toMinutes(p.start) + delta), end: toTime(toMinutes(p.end) + delta) },
	);
}

/** A new start for one period: it and the periods after it move together, so only the rest before it changes. */
export function setStart(periods: readonly Period[], index: number, start: string): Period[] {
	if (!/^\d{2}:\d{2}$/.test(start) || !periods[index]) return [...periods];
	return shiftFrom(periods, index, toMinutes(start) - toMinutes(periods[index].start));
}

/** A new length for one period (at least 15 minutes); the periods after it keep their rests. */
export function setLength(periods: readonly Period[], index: number, length: number): Period[] {
	const p = periods[index];
	if (!p) return [...periods];
	const next = Math.max(15, length);
	const resized = periods.map((x, i) => (i === index ? { start: x.start, end: toTime(toMinutes(x.start) + next) } : x));
	return shiftFrom(resized, index + 1, next - lengthOf(p));
}

/** A new rest after period `index` (never below zero); the periods after it move. */
export function setRest(periods: readonly Period[], index: number, rest: number): Period[] {
	if (index < 0 || index >= periods.length - 1) return [...periods];
	const current = toMinutes(periods[index + 1].start) - toMinutes(periods[index].end);
	return shiftFrom(periods, index + 1, Math.max(0, rest) - current);
}

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
