import { describe, expect, it } from "vitest";

import { productSchema } from "./product";

const card = { kind: "membership" as const, name: "Start To Align", price: "1500", credits: "10", durationMonths: "3" };

describe("a membership on the website", () => {
	it("stays off the site unless she says so", () => {
		expect(productSchema.parse(card)).toMatchObject({ onSite: false, siteKey: "", sitePosition: 0, popular: false });
	});

	it("needs a key that can sit in a link once it's on the site", () => {
		const result = productSchema.safeParse({ ...card, onSite: true, siteKey: "" });
		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.path).toEqual(["siteKey"]);
		expect(productSchema.safeParse({ ...card, onSite: true, siteKey: "start to align" }).success).toBe(false);
	});

	it("tidies a key typed with capitals and spaces around it", () => {
		expect(productSchema.parse({ ...card, onSite: true, siteKey: "  Start-To-Align " })).toMatchObject({ siteKey: "start-to-align" });
	});

	it("reads its place in the row as a whole number", () => {
		expect(productSchema.parse({ ...card, onSite: true, siteKey: "start-to-align", sitePosition: "2" })).toMatchObject({ sitePosition: 2 });
	});
});
