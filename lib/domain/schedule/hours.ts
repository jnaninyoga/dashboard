// The studio's hours: each day closed, or the periods she works, with the
// rests between them. One setting with two readers: the dashboard only
// schedules group and private sessions inside a period, and jnaninyoga.com
// shows the open days with their periods.

import { inOrder, restsOf, showTime, toMinutes } from "./day-chain";

export type Period = { start: string; end: string };
export type DayHours = { isOpen: boolean; periods: Period[] };
/** By day key, Date.getDay numbering as text: "1" Monday … "6" Saturday, "0" Sunday. */
export type WorkingHoursConfig = Record<string, DayHours>;

/** Monday first, Sunday last: the studio's week, as day keys. */
export const WEEK_KEYS = ["1", "2", "3", "4", "5", "6", "0"] as const;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const isPeriod = (p: unknown): p is Period =>
	typeof p === "object" && p !== null && TIME.test(String((p as Period).start)) && TIME.test(String((p as Period).end));

/**
 * Saved hours, whatever shape they were saved in. Before rests existed a day
 * was one range, { isOpen, start, end }; it reads as a single period.
 */
export function readWorkingHours(value: unknown): WorkingHoursConfig | null {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
	const week: WorkingHoursConfig = {};
	for (const key of WEEK_KEYS) {
		const day = (value as Record<string, unknown>)[key] as Record<string, unknown> | undefined;
		if (!day || typeof day !== "object") return null;
		const periods = Array.isArray(day.periods) ? day.periods.filter(isPeriod) : isPeriod(day) ? [{ start: day.start as string, end: day.end as string }] : [];
		week[key] = { isOpen: day.isOpen === true, periods: inOrder(periods) };
	}
	return week;
}

const range = (p: Period) => `${showTime(p.start)}–${showTime(p.end)}`;

/** What stops one day from saving: an open day with no period, one that ends before it starts, two that overlap. */
export function dayProblem(day: DayHours): string | null {
	if (!day.isOpen) return null;
	if (!day.periods.length) return "Add a period, or close the day";
	const periods = inOrder(day.periods);
	const backwards = periods.find((p) => toMinutes(p.end) <= toMinutes(p.start));
	if (backwards) return `${range(backwards)} ends before it starts`;
	const overlap = restsOf(periods).findIndex((rest) => rest < 0);
	if (overlap >= 0) return `${range(periods[overlap])} overlaps ${range(periods[overlap + 1])}`;
	return null;
}

/** Every day that can't be saved, by day key. Empty when the week can be saved. */
export function weekProblems(week: WorkingHoursConfig): Record<string, string> {
	const problems: Record<string, string> = {};
	for (const key of WEEK_KEYS) {
		const day = week[key];
		const problem = day ? dayProblem(day) : "Missing";
		if (problem) problems[key] = problem;
	}
	return problems;
}

/**
 * Why a session from `start` to `end` can't be scheduled on this day, or
 * null when it sits inside one of its periods. A session never spans a rest.
 */
export function sessionProblem(day: DayHours | undefined, start: string, end: string): string | null {
	if (!day?.isOpen || !day.periods.length) return "The studio is closed on this day. Change Studio hours to open it.";
	const from = toMinutes(start);
	const to = toMinutes(end);
	const periods = inOrder(day.periods);
	if (periods.some((p) => from >= toMinutes(p.start) && to <= toMinutes(p.end))) return null;
	const first = periods[0];
	const last = periods.at(-1)!;
	if (from < toMinutes(first.start) || to > toMinutes(last.end)) {
		return `That's outside Studio hours: this day runs ${showTime(first.start)}–${showTime(last.end)}.`;
	}
	const rest = periods.slice(1).findIndex((p, i) => from < toMinutes(p.start) && to > toMinutes(periods[i].end));
	if (rest >= 0) return `That runs into a rest (${showTime(periods[rest].end)}–${showTime(periods[rest + 1].start)}). Pick a time inside one period.`;
	return `That runs into a rest. Pick a time inside one period: ${periods.map(range).join(", ")}.`;
}

/** The open days grouped by the same periods, Monday first: what the website lists. */
export function hourGroups(week: WorkingHoursConfig): { days: number[]; periods: Period[] }[] {
	const groups: { days: number[]; periods: Period[] }[] = [];
	for (const key of WEEK_KEYS) {
		const day = week[key];
		if (!day?.isOpen || !day.periods.length) continue;
		const periods = inOrder(day.periods);
		const same = groups.find((g) => JSON.stringify(g.periods) === JSON.stringify(periods));
		if (same) same.days.push(Number(key));
		else groups.push({ days: [Number(key)], periods });
	}
	return groups;
}
