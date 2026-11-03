import { describe, expect, it } from "vitest";

import { ageOn, healthPicture } from "./health";

const note = (id: string, severity: "info" | "warning" | "critical", startDate: string, more: { isAlert?: boolean; endDate?: string | null } = {}) => ({
	id,
	severity,
	startDate,
	isAlert: more.isAlert ?? severity !== "info",
	endDate: more.endDate ?? null,
});

describe("healthPicture", () => {
	it("puts open alerts first, critical then newest, and notes apart", () => {
		const picture = healthPicture([
			note("w-old", "warning", "2026-01-10"),
			note("info", "info", "2026-05-01"),
			note("crit", "critical", "2025-06-01"),
			note("w-new", "warning", "2026-09-01"),
		]);
		expect(picture.alerts.map((n) => n.id)).toEqual(["crit", "w-new", "w-old"]);
		expect(picture.notes.map((n) => n.id)).toEqual(["info"]);
		expect(picture.resolved).toEqual([]);
	});

	it("keeps resolved notes as history, the latest resolved first", () => {
		const picture = healthPicture([
			note("a", "warning", "2026-01-10", { isAlert: false, endDate: "2026-03-01" }),
			note("b", "info", "2026-02-10", { endDate: "2026-06-01" }),
			// Switched off before end dates were kept.
			note("c", "critical", "2025-12-01", { isAlert: false }),
		]);
		expect(picture.alerts).toEqual([]);
		expect(picture.notes).toEqual([]);
		expect(picture.resolved.map((n) => n.id)).toEqual(["b", "a", "c"]);
	});
});

describe("ageOn", () => {
	it("counts a year only once the birthday has passed", () => {
		expect(ageOn("1990-06-15", "2026-06-14")).toBe(35);
		expect(ageOn("1990-06-15", "2026-06-15")).toBe(36);
		expect(ageOn("1990-01-01", "2026-11-03")).toBe(36);
	});
});
