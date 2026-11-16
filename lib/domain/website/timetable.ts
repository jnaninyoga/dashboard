// How jnaninyoga.com says Studio hours, in French and English. Written here,
// once, and tested: the site receives the words with the hours, so the
// dashboard's preview is exactly what the site will say.

import { showTime } from "@/lib/domain/schedule/day-chain";
import { hourGroups, type Period, type WorkingHoursConfig } from "@/lib/domain/schedule/hours";

/** The days of one group, joined by "and" and by "or": "lundi et jeudi", "lundi ou jeudi". */
export type DaysWords = { daysAnd: string; daysOr: string };
export type SiteHoursGroup = { days: number[]; periods: Period[]; words: { fr: DaysWords; en: DaysWords } };
/** What the website shows: the open days grouped by the same periods, and its headline. */
export type SiteHours = { groups: SiteHoursGroup[]; words: { fr: { headline: string }; en: { headline: string } } };

const FR_DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const FR_NUMBERS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze"];
const EN_NUMBERS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

const list = (items: string[], and: string) =>
	items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} ${and} ${items.at(-1)}`;
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
/** "08:30" → "8h30", "09:00" → "9h", as the site writes French times. */
const frTime = (time: string) => showTime(time).replace(/:00$/, "h").replace(":", "h");

/** One group's days in both languages ("lundi et jeudi", "Monday or Thursday"); all seven are "every day". */
export function daysWords(days: number[]): { fr: DaysWords; en: DaysWords } {
	if (days.length === 7) {
		return { fr: { daysAnd: "tous les jours", daysOr: "tous les jours" }, en: { daysAnd: "every day", daysOr: "any day" } };
	}
	const fr = days.map((day) => FR_DAYS[day]);
	const en = days.map((day) => EN_DAYS[day]);
	return { fr: { daysAnd: list(fr, "et"), daysOr: list(fr, "ou") }, en: { daysAnd: list(en, "and"), daysOr: list(en, "or") } };
}

/** The headline: the days and how many periods when they share one set, else how many days a week. */
export function hoursHeadline(groups: { days: number[]; periods: Period[] }[]): { fr: string; en: string } {
	if (!groups.length) return { fr: "Sur rendez-vous.", en: "By appointment." };
	const open = groups.reduce((n, g) => n + g.days.length, 0);
	if (groups.length > 1) {
		if (open === 7) return { fr: "Tous les jours.", en: "Every day." };
		return { fr: `${capital(FR_NUMBERS[open])} jours par semaine.`, en: `${capital(EN_NUMBERS[open])} days a week.` };
	}

	const [{ days, periods }] = groups;
	const fr = days.length === 7 ? "Tous les jours" : days.length === 1 ? `Le ${FR_DAYS[days[0]]}` : capital(list(days.map((d) => FR_DAYS[d]), "et"));
	const en = days.length === 7 ? "Every day" : list(days.map((d) => `${EN_DAYS[d]}s`), "and");
	if (periods.length === 1) {
		const [p] = periods;
		return { fr: `${fr}, de ${frTime(p.start)} à ${frTime(p.end)}.`, en: `${en}, ${showTime(p.start)} to ${showTime(p.end)}.` };
	}
	const n = periods.length;
	return {
		fr: `${fr}, ${n <= 12 ? FR_NUMBERS[n] : n} rendez-vous.`,
		en: `${en}, ${n <= 12 ? EN_NUMBERS[n] : n} sessions.`,
	};
}

/** Studio hours as the website receives them. */
export function siteHours(week: WorkingHoursConfig): SiteHours {
	const groups = hourGroups(week);
	const headline = hoursHeadline(groups);
	return {
		groups: groups.map((g) => ({ ...g, words: daysWords(g.days) })),
		words: { fr: { headline: headline.fr }, en: { headline: headline.en } },
	};
}
