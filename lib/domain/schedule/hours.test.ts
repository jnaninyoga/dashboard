import { DEFAULT_HOURS } from "@/lib/config/schedule";

import { describe, expect, it } from "vitest";

import { dayProblem, hourGroups, readWorkingHours, sessionProblem, weekProblems } from "./hours";

const monday = DEFAULT_HOURS["1"];

describe("readWorkingHours", () => {
	it("reads a day saved before rests existed as one period", () => {
		const saved = Object.fromEntries(["0", "1", "2", "3", "4", "5", "6"].map((k) => [k, { isOpen: k !== "0", start: "08:00", end: "20:00" }]));
		const week = readWorkingHours(saved)!;
		expect(week["1"]).toEqual({ isOpen: true, periods: [{ start: "08:00", end: "20:00" }] });
		expect(week["0"].isOpen).toBe(false);
	});

	it("reads periods in order", () => {
		const week = readWorkingHours({ ...DEFAULT_HOURS, "2": { isOpen: true, periods: [{ start: "14:00", end: "18:00" }, { start: "09:00", end: "12:00" }] } })!;
		expect(week["2"].periods.map((p) => p.start)).toEqual(["09:00", "14:00"]);
	});

	it("gives up on something that isn't a week", () => {
		expect(readWorkingHours(null)).toBeNull();
		expect(readWorkingHours({ "1": { isOpen: true } })).toBeNull();
	});
});

describe("dayProblem and weekProblems", () => {
	it("accepts the website's week", () => {
		expect(weekProblems(DEFAULT_HOURS)).toEqual({});
	});

	it("says what stops a day from saving", () => {
		expect(dayProblem({ isOpen: true, periods: [] })).toBe("Add a period, or close the day");
		expect(dayProblem({ isOpen: true, periods: [{ start: "10:00", end: "09:00" }] })).toBe("10:00–9:00 ends before it starts");
		expect(dayProblem({ isOpen: true, periods: [{ start: "08:30", end: "10:00" }, { start: "09:30", end: "11:00" }] })).toBe(
			"8:30–10:00 overlaps 9:30–11:00",
		);
		expect(dayProblem({ isOpen: false, periods: [] })).toBeNull();
	});

	it("names the days by key", () => {
		expect(weekProblems({ ...DEFAULT_HOURS, "3": { isOpen: true, periods: [] } })).toEqual({ "3": "Add a period, or close the day" });
	});
});

describe("sessionProblem", () => {
	it("lets a session sit inside a period", () => {
		expect(sessionProblem(monday, "08:30", "10:00")).toBeNull();
		expect(sessionProblem(monday, "15:30", "16:30")).toBeNull();
	});

	it("refuses one that runs into a rest, naming the rest", () => {
		expect(sessionProblem(monday, "13:30", "15:00")).toBe("That runs into a rest (14:00–15:30). Pick a time inside one period.");
		expect(sessionProblem(monday, "14:15", "15:00")).toBe("That runs into a rest (14:00–15:30). Pick a time inside one period.");
	});

	it("refuses one outside the day, and on a closed day", () => {
		expect(sessionProblem(monday, "07:00", "08:00")).toBe("That's outside Studio hours: this day runs 8:30–21:00.");
		expect(sessionProblem(DEFAULT_HOURS["2"], "09:00", "10:00")).toBe("The studio is closed on this day. Change Studio hours to open it.");
	});
});

describe("hourGroups", () => {
	it("groups the open days that share their periods, Monday first", () => {
		const week = { ...DEFAULT_HOURS, "6": { isOpen: true, periods: [{ start: "09:00", end: "13:00" }] }, "2": { isOpen: true, periods: [{ start: "09:00", end: "13:00" }] } };
		expect(hourGroups(week).map((g) => g.days)).toEqual([[1, 4], [2, 6]]);
	});

	it("leaves closed days out", () => {
		expect(hourGroups(DEFAULT_HOURS)).toEqual([{ days: [1, 4], periods: monday.periods }]);
	});
});
