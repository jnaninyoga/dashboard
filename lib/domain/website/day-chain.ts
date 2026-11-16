// Her teaching day as she thinks of it: a class, a rest, a class, a rest…
// Changing a rest or a class's length moves the classes after it, so the
// other rests stay as they were. The website still receives plain times.

import { type ClassTime } from "./timetable";

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

/** The classes by start time. */
export const inOrder = (times: readonly ClassTime[]) => [...times].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

export const lengthOf = (t: ClassTime) => toMinutes(t.end) - toMinutes(t.start);

/** The rest after each class but the last, in minutes (negative when two overlap). */
export const restsOf = (times: readonly ClassTime[]) => times.slice(1).map((t, i) => toMinutes(t.start) - toMinutes(times[i].end));

/** Moves class `index` and every class after it by `delta` minutes. */
export function shiftFrom(times: readonly ClassTime[], index: number, delta: number): ClassTime[] {
	return times.map((t, i) =>
		i < index ? t : { start: toTime(toMinutes(t.start) + delta), end: toTime(toMinutes(t.end) + delta) },
	);
}

/** A new start for one class: it and the classes after it move together, so only the rest before it changes. */
export function setStart(times: readonly ClassTime[], index: number, start: string): ClassTime[] {
	if (!/^\d{2}:\d{2}$/.test(start) || !times[index]) return [...times];
	return shiftFrom(times, index, toMinutes(start) - toMinutes(times[index].start));
}

/** A new length for one class (at least 15 minutes); the classes after it keep their rests. */
export function setLength(times: readonly ClassTime[], index: number, length: number): ClassTime[] {
	const t = times[index];
	if (!t) return [...times];
	const next = Math.max(15, length);
	const resized = times.map((x, i) => (i === index ? { start: x.start, end: toTime(toMinutes(x.start) + next) } : x));
	return shiftFrom(resized, index + 1, next - lengthOf(t));
}

/** A new rest after class `index` (never below zero); the classes after it move. */
export function setRest(times: readonly ClassTime[], index: number, rest: number): ClassTime[] {
	if (index < 0 || index >= times.length - 1) return [...times];
	const current = toMinutes(times[index + 1].start) - toMinutes(times[index].end);
	return shiftFrom(times, index + 1, Math.max(0, rest) - current);
}

/** One more class after the last, with the same rest and length as the one before (30 min and 1h30 to begin with). */
export function addClass(times: readonly ClassTime[]): ClassTime[] {
	const last = times.at(-1);
	if (!last) return [{ start: "09:00", end: "10:30" }];
	const rest = Math.max(0, restsOf(times).at(-1) ?? 30);
	const start = toMinutes(last.end) + rest;
	return [...times, { start: toTime(start), end: toTime(start + lengthOf(last)) }];
}

/** "1h30", "2h", "45 min". */
export function showLength(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	if (!h) return `${m} min`;
	return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}
