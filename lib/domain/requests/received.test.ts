import { describe, expect, it } from "vitest";

import { receivedLabel } from "./received";

// June 2026: Marrakech is on UTC+1 in every version of the zone data.
const now = new Date("2026-06-10T15:00:00Z");

describe("receivedLabel", () => {
	it("says today with the studio's time", () => {
		expect(receivedLabel(new Date("2026-06-10T08:41:00Z"), now)).toBe("Today 9:41");
	});

	it("says yesterday", () => {
		expect(receivedLabel(new Date("2026-06-09T17:02:00Z"), now)).toBe("Yesterday 18:02");
	});

	it("names an earlier day this year", () => {
		expect(receivedLabel(new Date("2026-06-01T08:05:00Z"), now)).toBe("Mon 1 Jun 9:05");
	});

	it("gives the year for another year, without the time", () => {
		expect(receivedLabel(new Date("2025-12-30T10:00:00Z"), now)).toBe("30 Dec 2025");
	});

	it("counts the day in Marrakech, not in UTC", () => {
		// 23:30 UTC on the 9th is 00:30 on the 10th in Marrakech.
		expect(receivedLabel(new Date("2026-06-09T23:30:00Z"), now)).toBe("Today 0:30");
	});
});
