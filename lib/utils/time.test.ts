import { describe, expect, it } from "vitest";

import {
	addDays,
	currentHourStart,
	fromStudioTime,
	getDayPeriod,
	studioDateString,
	studioDaysRange,
	studioDayStart,
	studioIsoString,
	studioMonthStart,
	toStudioTime,
	weekdayOf,
	weekDays,
	weekOf,
	weekStart,
} from "./time";

// Morocco's offset is set by decree (Ramadan, and the move to UTC+0 on
// 20 Sep 2026), so these use dates every current tz database agrees on
// rather than "today's" offset.
describe("toStudioTime", () => {
	it("reads the clock in Marrakech, not the server's zone", () => {
		// June 2026: UTC+1, so 11:30 UTC is 12:30 at the studio.
		expect(toStudioTime(new Date("2026-06-15T11:30:00Z")).getHours()).toBe(12);
	});

	it("rolls the date over at the studio's midnight", () => {
		const late = toStudioTime(new Date("2026-06-15T23:30:00Z"));
		expect(late.getDate()).toBe(16);
		expect(late.getHours()).toBe(0);
	});

	it("follows Morocco's Ramadan time (UTC+0) when it applies", () => {
		// Ramadan 2026 runs mid-February to mid-March.
		expect(toStudioTime(new Date("2026-03-05T10:00:00Z")).getHours()).toBe(10);
	});
});

describe("studio dates and times", () => {
	it("names the studio's day, which can differ from the UTC day", () => {
		expect(studioDateString(new Date("2026-06-15T23:30:00Z"))).toBe("2026-06-16");
	});

	it("turns a studio wall-clock time into the right instant", () => {
		expect(fromStudioTime("2026-06-15", "10:00").toISOString()).toBe("2026-06-15T09:00:00.000Z");
		expect(fromStudioTime("2026-03-05", "10:00").toISOString()).toBe("2026-03-05T10:00:00.000Z");
	});

	it("follows the clock either side of the 2026 Ramadan changes", () => {
		// UTC+1 before Ramadan, UTC+0 during it, UTC+1 again after.
		expect(fromStudioTime("2026-02-10", "12:00").toISOString()).toBe("2026-02-10T11:00:00.000Z");
		expect(fromStudioTime("2026-02-20", "12:00").toISOString()).toBe("2026-02-20T12:00:00.000Z");
		expect(fromStudioTime("2026-03-17", "12:00").toISOString()).toBe("2026-03-17T12:00:00.000Z");
		expect(fromStudioTime("2026-03-27", "12:00").toISOString()).toBe("2026-03-27T11:00:00.000Z");
	});

	it("starts the studio's day and month at its own midnight", () => {
		// June 2026 is UTC+1: 10:00 UTC on the 15th is the studio's 15th, which began at 23:00 UTC on the 14th.
		const june = new Date("2026-06-15T10:00:00Z");
		expect(studioDayStart(june).toISOString()).toBe("2026-06-14T23:00:00.000Z");
		expect(studioMonthStart(june).toISOString()).toBe("2026-05-31T23:00:00.000Z");
		// Ramadan 2026 is UTC+0.
		const ramadan = new Date("2026-03-05T10:00:00Z");
		expect(studioDayStart(ramadan).toISOString()).toBe("2026-03-05T00:00:00.000Z");
		expect(studioMonthStart(ramadan).toISOString()).toBe("2026-03-01T00:00:00.000Z");
	});

	it("floors to the start of the hour", () => {
		expect(currentHourStart(new Date("2026-06-15T09:37:12Z")).toISOString()).toBe("2026-06-15T09:00:00.000Z");
	});

	it("writes the studio's offset into the ISO string", () => {
		expect(studioIsoString("2026-06-15", "10:00")).toBe("2026-06-15T10:00:00+01:00");
		expect(studioIsoString("2026-03-05", "10:00")).toBe("2026-03-05T10:00:00+00:00");
	});

	it("reads the weekday from the date alone", () => {
		expect(weekdayOf("2026-06-15")).toBe(1); // a Monday
		expect(weekdayOf("2026-06-14")).toBe(0);
	});
});

describe("getDayPeriod", () => {
	const at = (hour: number) => getDayPeriod(new Date(2026, 9, 28, hour, 0));

	it("splits the day at 5, 12, 18 and 22", () => {
		expect([4, 5, 11, 12, 17, 18, 21, 22].map(at)).toEqual([
			"night", "morning", "morning", "afternoon", "afternoon", "evening", "evening", "night",
		]);
	});
});

// Weeks run Monday to Sunday on the studio's calendar.
describe("weeks", () => {
	it("finds the Monday of any day's week", () => {
		expect(weekStart("2026-10-26")).toBe("2026-10-26"); // a Monday
		expect(weekStart("2026-10-29")).toBe("2026-10-26"); // Thursday
		expect(weekStart("2026-11-01")).toBe("2026-10-26"); // Sunday ends the week
	});

	it("lists the seven days, across a year boundary too", () => {
		expect(weekStart("2027-01-01")).toBe("2026-12-28");
		expect(weekDays("2026-12-28")).toEqual([
			"2026-12-28",
			"2026-12-29",
			"2026-12-30",
			"2026-12-31",
			"2027-01-01",
			"2027-01-02",
			"2027-01-03",
		]);
	});

	it("adds days on the calendar (month ends, leap years)", () => {
		expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
		expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
		expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
	});

	it("covers a week from its Monday's midnight to the next Monday's, as instants", () => {
		// June 2026, UTC+1 throughout.
		const june = studioDaysRange("2026-06-15", "2026-06-21");
		expect(june.start.toISOString()).toBe("2026-06-14T23:00:00.000Z");
		expect(june.end.toISOString()).toBe("2026-06-21T23:00:00.000Z");
	});

	it("follows the Ramadan clock changes inside a week", () => {
		// Clocks went back to UTC+0 on Sunday 15 Feb 2026: that week is an hour longer.
		const into = studioDaysRange("2026-02-09", "2026-02-15");
		expect(into.start.toISOString()).toBe("2026-02-08T23:00:00.000Z");
		expect(into.end.toISOString()).toBe("2026-02-16T00:00:00.000Z");
		// And forward to UTC+1 on Sunday 22 Mar 2026: an hour shorter.
		const out = studioDaysRange("2026-03-16", "2026-03-22");
		expect(out.start.toISOString()).toBe("2026-03-16T00:00:00.000Z");
		expect(out.end.toISOString()).toBe("2026-03-22T23:00:00.000Z");
	});

	it("reads a ?week= value as the Monday it names, or else the current week", () => {
		const now = new Date("2026-06-17T10:00:00Z"); // a Wednesday
		expect(weekOf("2026-06-10", now)).toBe("2026-06-08");
		expect(weekOf(undefined, now)).toBe("2026-06-15");
		expect(weekOf("not-a-date", now)).toBe("2026-06-15");
		expect(weekOf("2026-02-30", now)).toBe("2026-06-15"); // no such day
	});
});
