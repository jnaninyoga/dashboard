import { describe, expect, it } from "vitest";

import { addQuantities, findSameLine, mergeSameLines } from "./same-lines";

const line = (description: string, quantity: string, unitPrice: string, sourceLineId: string | null = null) => ({
	description,
	quantity,
	unitPrice,
	sourceLineId,
});

describe("findSameLine", () => {
	const lines = [line("Famille (3–5 pax)", "1", "450"), line("Mat rental", "2", "90"), line("", "1", "0")];

	it("finds the same item: same words and price, accents and capitals aside", () => {
		expect(findSameLine(lines, line(" famille (3–5 PAX) ", "1", "450.00"), 3)).toBe(0);
	});

	it("never matches the line itself", () => {
		expect(findSameLine(lines, lines[0], 0)).toBe(-1);
	});

	it("keeps lines at another price apart", () => {
		expect(findSameLine(lines, line("Famille (3–5 pax)", "1", "400"), 3)).toBe(-1);
	});

	it("ignores empty lines, and lines without a quantity yet", () => {
		expect(findSameLine(lines, line("", "1", "0"), 3)).toBe(-1);
		expect(findSameLine(lines, line("Mat rental", "", "90"), 3)).toBe(-1);
	});

	it("keeps an invoice's lines for different quotation lines apart", () => {
		const invoice = [line("Famille (3–5 pax)", "1", "450", "q1")];
		expect(findSameLine(invoice, line("Famille (3–5 pax)", "1", "450", "q2"), 1)).toBe(-1);
		expect(findSameLine(invoice, line("Famille (3–5 pax)", "1", "450", "q1"), 1)).toBe(0);
	});
});

describe("addQuantities", () => {
	it("adds to the cent, without float noise", () => {
		expect(addQuantities("0.1", "0.2")).toBe("0.3");
		expect(addQuantities("2", "1")).toBe("3");
	});
});

describe("mergeSameLines", () => {
	it("adds a repeated line's quantity to the first one, in place", () => {
		const merged = mergeSameLines([
			line("Famille (3–5 pax)", "1", "450"),
			line("Mat rental", "1", "90"),
			line("famille (3–5 pax)", "2", "450"),
		]);
		expect(merged).toEqual([line("Famille (3–5 pax)", "3", "450"), line("Mat rental", "1", "90")]);
	});

	it("leaves distinct lines as they are", () => {
		const lines = [line("Famille (3–5 pax)", "1", "450"), line("Famille (3–5 pax)", "1", "400")];
		expect(mergeSameLines(lines)).toEqual(lines);
	});
});
