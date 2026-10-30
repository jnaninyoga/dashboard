import { describe, expect, it } from "vitest";

import { alertChipLabel, alertsSummary, creditsSummary, lastVisitLabel, sortAlerts } from "./card";

describe("creditsSummary", () => {
	it("gives the credits left and the card's total", () => {
		expect(creditsSummary({ remainingCredits: 6, membership: { defaultCredits: 10 } })).toEqual({ count: 6, total: 10, tone: "ok" });
		expect(creditsSummary({ remainingCredits: 6, membership: null })).toEqual({ count: 6, total: null, tone: "ok" });
	});

	it("warns when two or fewer are left, or none", () => {
		expect(creditsSummary({ remainingCredits: 2, membership: { defaultCredits: 10 } }).tone).toBe("low");
		expect(creditsSummary({ remainingCredits: 3, membership: { defaultCredits: 10 } }).tone).toBe("ok");
		expect(creditsSummary({ remainingCredits: 0, membership: { defaultCredits: 10 } })).toEqual({ count: 0, total: 10, tone: "low" });
	});

	it("says so when there is no active card", () => {
		expect(creditsSummary(undefined)).toEqual({ count: null, total: null, tone: "none" });
		expect(creditsSummary(null)).toEqual({ count: null, total: null, tone: "none" });
	});
});

// Thursday 29 October 2026, early afternoon at the studio.
const now = new Date("2026-10-29T13:00:00Z");

describe("lastVisitLabel", () => {
	it("speaks of today and yesterday in the studio's days", () => {
		expect(lastVisitLabel(new Date("2026-10-29T09:30:00Z"), now)).toBe("Today");
		expect(lastVisitLabel(new Date("2026-10-28T18:00:00Z"), now)).toBe("Yesterday");
	});

	it("names the day for earlier visits, with the year when it isn't this year", () => {
		expect(lastVisitLabel(new Date("2026-10-27T10:00:00Z"), now)).toBe("Tue 27 Oct");
		expect(lastVisitLabel(new Date("2025-12-30T10:00:00Z"), now)).toBe("30 Dec 2025");
	});

	it("says so when the client hasn't come yet", () => {
		expect(lastVisitLabel(undefined, now)).toBe("Not yet");
	});
});

const log = (condition: string, severity: "info" | "warning" | "critical", startDate: string) => ({
	condition,
	severity,
	startDate,
});

describe("sortAlerts", () => {
	it("puts critical alerts first, then warnings, then notes; newest first within each", () => {
		const sorted = sortAlerts([
			log("Old back pain", "warning", "2026-01-10"),
			log("Asthma", "info", "2026-05-01"),
			log("Knee surgery", "critical", "2026-09-01"),
			log("Recent shoulder strain", "warning", "2026-10-01"),
		]);
		expect(sorted.map((l) => l.condition)).toEqual(["Knee surgery", "Recent shoulder strain", "Old back pain", "Asthma"]);
	});

	it("does not reorder the list it was given", () => {
		const logs = [log("A", "info", "2026-01-01"), log("B", "critical", "2026-01-01")];
		sortAlerts(logs);
		expect(logs[0].condition).toBe("A");
	});
});

describe("alertsSummary", () => {
	it("lists the conditions in order and marks the critical ones", () => {
		expect(
			alertsSummary([log("Asthma", "info", "2026-05-01"), log("Knee surgery", "critical", "2026-09-01")]),
		).toBe("Knee surgery (critical), Asthma");
	});
});

describe("alertChipLabel", () => {
	it("names the most important condition, and how many more there are", () => {
		expect(alertChipLabel([log("Asthma", "info", "2026-05-01")])).toBe("Asthma");
		expect(
			alertChipLabel([log("Asthma", "info", "2026-05-01"), log("Knee surgery", "critical", "2026-09-01"), log("Back pain", "warning", "2026-06-01")]),
		).toBe("Knee surgery +2");
	});
});
