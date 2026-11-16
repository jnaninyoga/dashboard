import { DEFAULT_HOURS } from "@/lib/config/schedule";

import { describe, expect, it } from "vitest";

import { classTimesProblems, DEFAULT_CLASS_TIMES, normalizeClassTimes, timetableWords } from "./timetable";

const times = (n: number) =>
	Array.from({ length: n }, (_, i) => ({ start: `${String(8 + i).padStart(2, "0")}:00`, end: `${String(8 + i).padStart(2, "0")}:45` }));

describe("DEFAULT_CLASS_TIMES", () => {
	it("is today's timetable: Monday and Thursday, six sessions", () => {
		expect(DEFAULT_CLASS_TIMES.days).toEqual([1, 4]);
		expect(DEFAULT_CLASS_TIMES.times.map((t) => `${t.start}-${t.end}`)).toEqual([
			"08:30-10:00",
			"10:30-12:00",
			"12:30-14:00",
			"15:30-17:00",
			"17:30-19:00",
			"19:30-21:00",
		]);
	});
});

describe("timetableWords", () => {
	it("says today's timetable as the site does", () => {
		expect(timetableWords(DEFAULT_CLASS_TIMES)).toEqual({
			fr: { headline: "Lundi et jeudi, six rendez-vous.", daysAnd: "lundi et jeudi", daysOr: "lundi ou jeudi" },
			en: { headline: "Mondays and Thursdays, six sessions.", daysAnd: "Monday and Thursday", daysOr: "Monday or Thursday" },
		});
	});

	it("says one day and one session", () => {
		const words = timetableWords({ days: [3], times: times(1) });
		expect(words.fr.headline).toBe("Le mercredi, un rendez-vous.");
		expect(words.en.headline).toBe("Wednesdays, one session.");
		expect(words.fr.daysOr).toBe("mercredi");
	});

	it("lists three days", () => {
		const words = timetableWords({ days: [1, 3, 5], times: times(2) });
		expect(words.fr.headline).toBe("Lundi, mercredi et vendredi, deux rendez-vous.");
		expect(words.en.headline).toBe("Mondays, Wednesdays and Fridays, two sessions.");
		expect(words.en.daysOr).toBe("Monday, Wednesday or Friday");
	});

	it("says every day", () => {
		const words = timetableWords({ days: [0, 1, 2, 3, 4, 5, 6], times: times(3) });
		expect(words.fr.headline).toBe("Tous les jours, trois rendez-vous.");
		expect(words.en.headline).toBe("Every day, three sessions.");
		expect(words.fr.daysAnd).toBe("tous les jours");
		expect(words.en.daysOr).toBe("any day");
	});

	it("uses digits above twelve", () => {
		expect(timetableWords({ days: [1], times: times(13) }).en.headline).toBe("Mondays, 13 sessions.");
	});

	it("says by appointment when there are no classes", () => {
		expect(timetableWords({ days: [], times: times(2) }).fr.headline).toBe("Sur rendez-vous.");
		expect(timetableWords({ days: [1], times: [] }).en.headline).toBe("By appointment.");
	});

	it("orders the week from Monday, Sunday last", () => {
		expect(timetableWords({ days: [0, 6], times: times(1) }).en.daysAnd).toBe("Saturday and Sunday");
	});
});

describe("normalizeClassTimes", () => {
	it("sorts days from Monday and times by start, without repeats", () => {
		expect(
			normalizeClassTimes({ days: [4, 0, 1, 4], times: [{ start: "10:30", end: "12:00" }, { start: "08:30", end: "10:00" }] }),
		).toEqual({ days: [1, 4, 0], times: [{ start: "08:30", end: "10:00" }, { start: "10:30", end: "12:00" }] });
	});
});

describe("classTimesProblems", () => {
	const open = { ...DEFAULT_HOURS, "1": { isOpen: true, start: "08:00", end: "21:00" }, "4": { isOpen: true, start: "08:00", end: "21:00" } };

	it("accepts today's timetable when the studio is open until 21:00", () => {
		expect(classTimesProblems(DEFAULT_CLASS_TIMES, open)).toEqual([]);
	});

	it("refuses a class after closing, naming the day", () => {
		expect(classTimesProblems(DEFAULT_CLASS_TIMES, DEFAULT_HOURS)).toEqual([
			"Monday closes at 20:00: 19:30–21:00 doesn't fit. Change Studio hours first.",
		]);
	});

	it("refuses a closed day", () => {
		expect(classTimesProblems({ days: [0], times: times(1) }, DEFAULT_HOURS)).toEqual(["The studio is closed on Sunday."]);
	});

	it("refuses a class that ends before it starts, and overlapping classes", () => {
		expect(classTimesProblems({ days: [1], times: [{ start: "10:00", end: "09:00" }] }, open)).toEqual([
			"10:00–9:00 ends before it starts.",
		]);
		expect(
			classTimesProblems({ days: [1], times: [{ start: "08:30", end: "10:00" }, { start: "09:30", end: "11:00" }] }, open),
		).toEqual(["8:30–10:00 overlaps 9:30–11:00."]);
	});
});
