import { describe, expect, it } from "vitest";

import { dashboardConfig, isCurrent } from "./dashboard";

describe("isCurrent", () => {
	it("marks the dashboard only on the home page", () => {
		expect(isCurrent("/", "/")).toBe(true);
		expect(isCurrent("/clients", "/")).toBe(false);
	});

	it("marks a section on its pages and the pages under it", () => {
		expect(isCurrent("/clients", "/clients")).toBe(true);
		expect(isCurrent("/clients/123", "/clients")).toBe(true);
		expect(isCurrent("/b2b/documents/new", "/b2b/documents")).toBe(true);
	});

	it("does not confuse pages that share a prefix", () => {
		expect(isCurrent("/clientsx", "/clients")).toBe(false);
		expect(isCurrent("/b2b/partners", "/b2b/documents")).toBe(false);
	});
});

describe("navigation", () => {
	it("is grouped in her words, with no admin group names", () => {
		expect(dashboardConfig.sections.map((s) => s.label)).toEqual(["Today", "Studio", "Billing"]);
	});
});
