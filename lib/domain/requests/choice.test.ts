import { describe, expect, it } from "vitest";

import { messageExcerpt, splitChoice } from "./choice";

describe("splitChoice", () => {
	it("separates a card's name from its price, as the French site writes it", () => {
		expect(splitChoice("Start To Align (1 500 Dh)")).toEqual({ title: "Start To Align", amount: 1500 });
	});

	it("reads the English site's thousands separator", () => {
		expect(splitChoice("Elevate & Evolve (5,000 Dh)")).toEqual({ title: "Elevate & Evolve", amount: 5000 });
	});

	it("reads a single session's price", () => {
		expect(splitChoice("One session (200 Dh)")).toEqual({ title: "One session", amount: 200 });
	});

	it("keeps a choice without a price whole", () => {
		expect(splitChoice("Créneau de 8h30, lundi ou jeudi")).toEqual({ title: "Créneau de 8h30, lundi ou jeudi", amount: null });
		expect(splitChoice("—")).toEqual({ title: "—", amount: null });
	});

	it("leaves brackets that aren't a price in the title", () => {
		expect(splitChoice("Pas encore sûr(e), j'aimerais en parler")).toEqual({
			title: "Pas encore sûr(e), j'aimerais en parler",
			amount: null,
		});
	});
});

describe("messageExcerpt", () => {
	it("keeps a short message whole", () => {
		expect(messageExcerpt("first time")).toBe("first time");
	});

	it("cuts a long one with an ellipsis", () => {
		expect(messageExcerpt("x".repeat(100))).toBe(`${"x".repeat(80)}…`);
	});

	it("puts a message's lines on one", () => {
		expect(messageExcerpt("first time\n\nis it ok?")).toBe("first time is it ok?");
	});

	it("has nothing for no message", () => {
		expect(messageExcerpt(null)).toBe("");
		expect(messageExcerpt("   ")).toBe("");
	});
});
