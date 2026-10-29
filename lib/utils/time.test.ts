import { describe, expect, it } from "vitest";

import {
	fromStudioTime,
	getDayPeriod,
	studioDateString,
	studioIsoString,
	toStudioTime,
	weekdayOf,
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
