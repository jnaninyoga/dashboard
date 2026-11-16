// The studio's weekly class times as the website shows them, and the words
// it says them with, in French and English. Written here, once, and tested:
// the site receives the words with the times, so the dashboard's preview is
// exactly what the site will say.

import { type WorkingHoursConfig } from "@/lib/types";

export type ClassTime = { start: string; end: string };
/** `days` in Date.getDay numbering (0 Sunday … 6 Saturday); times as the studio's wall clock, "HH:mm". */
export type ClassTimes = { days: number[]; times: ClassTime[] };

export type Words = { headline: string; daysAnd: string; daysOr: string };

/** The timetable the website showed before it came from here: Monday and Thursday, six sessions. */
export const DEFAULT_CLASS_TIMES: ClassTimes = {
	days: [1, 4],
	times: [
		{ start: "08:30", end: "10:00" },
		{ start: "10:30", end: "12:00" },
		{ start: "12:30", end: "14:00" },
		{ start: "15:30", end: "17:00" },
		{ start: "17:30", end: "19:00" },
		{ start: "19:30", end: "21:00" },
	],
};

/** Monday first, Sunday last: the studio's week. */
const WEEK = [1, 2, 3, 4, 5, 6, 0];
const FR_DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const FR_NUMBERS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze"];
const EN_NUMBERS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

const minutes = (time: string) => {
	const [h, m] = time.split(":").map(Number);
	return h * 60 + m;
};

/** "08:30" as people write it: "8:30". */
export const showTime = (time: string) => time.replace(/^0(\d)/, "$1");
const showRange = (t: ClassTime) => `${showTime(t.start)}–${showTime(t.end)}`;

/** The days in the studio's week order without repeats, and the times by start. */
export function normalizeClassTimes(ct: ClassTimes): ClassTimes {
	const days = WEEK.filter((day) => ct.days.includes(day));
	const times = [...ct.times].sort((a, b) => minutes(a.start) - minutes(b.start));
	return { days, times };
}

const list = (items: string[], and: string) =>
	items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} ${and} ${items.at(-1)}`;
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** How the site says the timetable: its headline, and the days joined by "and" and by "or". */
export function timetableWords(ct: ClassTimes): { fr: Words; en: Words } {
	const { days, times } = normalizeClassTimes(ct);
	if (!days.length || !times.length) {
		return {
			fr: { headline: "Sur rendez-vous.", daysAnd: "sur rendez-vous", daysOr: "sur rendez-vous" },
			en: { headline: "By appointment.", daysAnd: "by appointment", daysOr: "by appointment" },
		};
	}

	const n = times.length;
	const frCount = `${n <= 12 ? FR_NUMBERS[n] : n} rendez-vous`;
	const enCount = `${n <= 12 ? EN_NUMBERS[n] : n} ${n === 1 ? "session" : "sessions"}`;

	if (days.length === 7) {
		return {
			fr: { headline: `Tous les jours, ${frCount}.`, daysAnd: "tous les jours", daysOr: "tous les jours" },
			en: { headline: `Every day, ${enCount}.`, daysAnd: "every day", daysOr: "any day" },
		};
	}

	const fr = days.map((day) => FR_DAYS[day]);
	const en = days.map((day) => EN_DAYS[day]);
	const frDays = days.length === 1 ? `Le ${fr[0]}` : capital(list(fr, "et"));
	return {
		fr: { headline: `${frDays}, ${frCount}.`, daysAnd: list(fr, "et"), daysOr: list(fr, "ou") },
		en: {
			headline: `${list(en.map((day) => `${day}s`), "and")}, ${enCount}.`,
			daysAnd: list(en, "and"),
			daysOr: list(en, "or"),
		},
	};
}

/**
 * What stops a timetable from being published: a class that ends before it
 * starts, two that overlap, a closed day, or a class outside the studio's
 * hours on one of its days. Empty when it can go on the site.
 */
export function classTimesProblems(ct: ClassTimes, hours: WorkingHoursConfig): string[] {
	const { days, times } = normalizeClassTimes(ct);
	const problems: string[] = [];

	for (const time of times) {
		if (minutes(time.end) <= minutes(time.start)) problems.push(`${showRange(time)} ends before it starts.`);
	}
	for (let i = 1; i < times.length; i++) {
		if (minutes(times[i].start) < minutes(times[i - 1].end)) {
			problems.push(`${showRange(times[i - 1])} overlaps ${showRange(times[i])}.`);
		}
	}

	const openDays = days.filter((day) => {
		if (hours[String(day)]?.isOpen) return true;
		problems.push(`The studio is closed on ${EN_DAYS[day]}.`);
		return false;
	});

	for (const time of times) {
		if (minutes(time.end) <= minutes(time.start)) continue;
		for (const day of openDays) {
			const open = hours[String(day)];
			if (minutes(time.start) < minutes(open.start)) {
				problems.push(`${EN_DAYS[day]} opens at ${showTime(open.start)}: ${showRange(time)} doesn't fit. Change Studio hours first.`);
				break;
			}
			if (minutes(time.end) > minutes(open.end)) {
				problems.push(`${EN_DAYS[day]} closes at ${showTime(open.end)}: ${showRange(time)} doesn't fit. Change Studio hours first.`);
				break;
			}
		}
	}
	return problems;
}

/** Why a day's hours can't be saved, and which of its fields is at fault. */
export type HoursProblem = { field: "isOpen" | "start" | "end"; message: string };

/**
 * The other side of the same rule: Studio hours that would leave one of the
 * website's classes outside them, by day key ("1" for Monday). Empty when
 * every class still fits. Saving hours is refused while it isn't, just as
 * saving class times outside the hours is.
 */
export function hoursProblems(ct: ClassTimes, hours: WorkingHoursConfig): Record<string, HoursProblem> {
	const { days, times } = normalizeClassTimes(ct);
	const real = times.filter((t) => minutes(t.end) > minutes(t.start));
	if (!real.length) return {};
	const first = real.reduce((a, t) => (minutes(t.start) < minutes(a) ? t.start : a), real[0].start);
	const last = real.reduce((a, t) => (minutes(t.end) > minutes(a) ? t.end : a), real[0].end);

	const problems: Record<string, HoursProblem> = {};
	for (const day of days) {
		const open = hours[String(day)];
		const on = `${EN_DAYS[day]}s`;
		if (!open?.isOpen) problems[day] = { field: "isOpen", message: `The website has classes on ${on}. Keep it open, or change Class times first.` };
		else if (minutes(open.start) > minutes(first)) problems[day] = { field: "start", message: `The website has a class from ${showTime(first)} on ${on}. Open by then, or change Class times first.` };
		else if (minutes(open.end) < minutes(last)) problems[day] = { field: "end", message: `The website has a class until ${showTime(last)} on ${on}. Stay open until then, or change Class times first.` };
	}
	return problems;
}
