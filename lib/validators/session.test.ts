import { describe, expect, it } from "vitest";

import { defaultSessionSlot } from "./session";

// Instants are UTC; June 2026 is UTC+1 at the studio, Ramadan 2026 UTC+0.
const at = (iso: string) => defaultSessionSlot(new Date(iso));

describe("defaultSessionSlot", () => {
	it("starts at the next full hour on the studio's clock, for one hour", () => {
		expect(at("2026-06-15T09:30:00Z")).toEqual({ dateStr: "2026-06-15", startTimeStr: "11:00", endTimeStr: "12:00" });
		expect(at("2026-03-05T10:20:00Z")).toEqual({ dateStr: "2026-03-05", startTimeStr: "11:00", endTimeStr: "12:00" });
	});

	it("never proposes a start before 08:00", () => {
		expect(at("2026-06-15T04:00:00Z")).toEqual({ dateStr: "2026-06-15", startTimeStr: "08:00", endTimeStr: "09:00" });
		// Just after midnight at the studio is already the studio's next day.
		expect(at("2026-06-15T23:30:00Z")).toEqual({ dateStr: "2026-06-16", startTimeStr: "08:00", endTimeStr: "09:00" });
	});

	it("moves to 08:00 the next morning once the evening is too late", () => {
		expect(at("2026-06-15T17:30:00Z").startTimeStr).toBe("19:00");
		expect(at("2026-06-15T18:30:00Z")).toEqual({ dateStr: "2026-06-16", startTimeStr: "08:00", endTimeStr: "09:00" });
	});
});
