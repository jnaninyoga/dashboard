import { describe, expect, it } from "vitest";

import { formatMoney, normalizeDecimalInput, parseAmountInput } from "./currency";

describe("parseAmountInput", () => {
	it("reads French notation, with any kind of space as thousands separator", () => {
		expect(parseAmountInput("1 000,50")).toBe(1000.5);
		expect(parseAmountInput("1 000,50")).toBe(1000.5);
		expect(parseAmountInput("1 000,50")).toBe(1000.5);
		expect(parseAmountInput("400,5")).toBe(400.5);
	});

	it("reads English notation", () => {
		expect(parseAmountInput("1,000.50")).toBe(1000.5);
		expect(parseAmountInput("400")).toBe(400);
		expect(parseAmountInput("400.25")).toBe(400.25);
	});

	it("passes numbers through and rejects anything that isn't an amount", () => {
		expect(parseAmountInput(12.5)).toBe(12.5);
		for (const bad of ["", "abc", "12a", "1..2", null, undefined]) {
			expect(parseAmountInput(bad)).toBeNaN();
		}
	});
});

describe("normalizeDecimalInput", () => {
	it("turns a French decimal comma into a dot instead of dropping it", () => {
		// The old filter kept only [0-9.], so 500,50 became 50050.
		expect(normalizeDecimalInput("500,50")).toBe("500.50");
		expect(normalizeDecimalInput("1 200,5")).toBe("1200.5");
	});

	it("drops letters, spaces and currency text", () => {
		expect(normalizeDecimalInput("12 MAD")).toBe("12");
		expect(normalizeDecimalInput("abc")).toBe("");
	});
});

describe("formatMoney", () => {
	it("writes French notation with two decimals, which parseAmountInput reads back", () => {
		expect(formatMoney(1234.5)).toBe("1\u202f234,50 MAD");
		expect(parseAmountInput(formatMoney(1234.5).replace(" MAD", ""))).toBe(1234.5);
	});
});
