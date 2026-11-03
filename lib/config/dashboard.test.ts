import { describe, expect, it } from "vitest";

import { bottomBar, dashboardConfig, isCurrent } from "./dashboard";

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
		expect(dashboardConfig.sections.map((s) => s.label)).toEqual(["Today", "Studio", "Billing", "Price list"]);
	});

	it("keeps what she sells in her price list, and only the studio in Settings", () => {
		const priceList = dashboardConfig.sections.find((s) => s.label === "Price list")!;
		expect(priceList.items.map((item) => item.title)).toEqual(["Memberships", "Partner rates", "Discounts"]);
		expect(dashboardConfig.settings.map((item) => item.title)).toEqual(["Studio profile", "Studio hours"]);
	});
});

describe("bottom bar", () => {
	it("carries her daily work around the + in the middle", () => {
		expect([...bottomBar.start, ...bottomBar.end].map((item) => item.title)).toEqual([
			"Today",
			"Check-in",
			"Clients",
			"Billing",
		]);
	});

	it("keeps Billing current across quotes, invoices and partners", () => {
		const billing = bottomBar.end.find((item) => item.title === "Billing")!;
		expect(isCurrent("/b2b/partners/7", billing.match ?? billing.url)).toBe(true);
		expect(isCurrent("/b2b/documents/new", billing.match ?? billing.url)).toBe(true);
		expect(isCurrent("/clients", billing.match ?? billing.url)).toBe(false);
	});
});
