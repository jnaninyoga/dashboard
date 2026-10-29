import { describe, expect, it } from "vitest";

import { alertsSummary, creditsLine, sortAlerts } from "./card";

describe("creditsLine", () => {
	it("says how many credits are left on the active card", () => {
		expect(creditsLine({ remainingCredits: 6 })).toEqual({ text: "6 credits left", tone: "ok" });
		expect(creditsLine({ remainingCredits: 1 })).toEqual({ text: "1 credit left", tone: "low" });
	});

	it("warns when two or fewer are left, or none", () => {
		expect(creditsLine({ remainingCredits: 2 }).tone).toBe("low");
		expect(creditsLine({ remainingCredits: 3 }).tone).toBe("ok");
		expect(creditsLine({ remainingCredits: 0 })).toEqual({ text: "No credits left", tone: "low" });
	});

	it("says so when there is no active card", () => {
		expect(creditsLine(undefined)).toEqual({ text: "No active card", tone: "none" });
		expect(creditsLine(null)).toEqual({ text: "No active card", tone: "none" });
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
