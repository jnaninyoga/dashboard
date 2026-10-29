import { describe, expect, it } from "vitest";

import { getDayPeriod, toStudioTime } from "./time";

describe("toStudioTime", () => {
	it("reads the clock in Marrakech, not the server's zone", () => {
		// Casablanca is UTC+1 outside Ramadan: 11:30 UTC is 12:30 at the studio.
		expect(toStudioTime(new Date("2026-10-28T11:30:00Z")).getHours()).toBe(12);
	});

	it("rolls the date over at the studio's midnight", () => {
		const late = toStudioTime(new Date("2026-10-28T23:30:00Z"));
		expect(late.getDate()).toBe(29);
		expect(late.getHours()).toBe(0);
	});

	it("follows Morocco's Ramadan time (UTC+0) when it applies", () => {
		// Ramadan 2026 runs mid-February to mid-March.
		expect(toStudioTime(new Date("2026-03-05T10:00:00Z")).getHours()).toBe(10);
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
