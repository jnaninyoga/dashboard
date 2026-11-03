import { describe, expect, it } from "vitest";

import {
	beyondTheQuote,
	linesSubtotal,
	portionByAmount,
	portionByQuantities,
	quoteBalance,
} from "./quote-billing";

// A 30,000 MAD quotation: 30 sessions at 800 (from her price list), and 60
// mat rentals at 100 (a line of her own).
const quote = [
	{ id: "sessions", description: "Séance hôtel", quantity: "30", unitPrice: "800", productId: "hotel", unit: "session" as const },
	{ id: "mats", description: "Location tapis", quantity: "60", unitPrice: "100" },
];
const invoice = (id: string, status: string, lines: [string | null, number, number][], archivedAt: string | null = null) => ({
	id,
	status,
	archivedAt,
	lines: lines.map(([sourceLineId, quantity, unitPrice]) => ({ sourceLineId, quantity, unitPrice })),
});

describe("quoteBalance", () => {
	it("is the whole quotation before any invoice", () => {
		const balance = quoteBalance(quote, []);
		expect(balance.quoted).toBe(30000);
		expect(balance.remaining).toBe(30000);
		expect(balance.lines.map((l) => l.remaining)).toEqual([30, 60]);
	});

	it("subtracts issued invoices and drafts, line by line", () => {
		const balance = quoteBalance(quote, [
			invoice("oct", "paid", [["sessions", 10, 800]]),
			invoice("nov", "draft", [["sessions", 5, 800], ["mats", 20, 100]]),
		]);
		expect(balance.billed).toBe(14000);
		expect(balance.remaining).toBe(16000);
		expect(balance.lines.map((l) => l.remaining)).toEqual([15, 40]);
	});

	it("gives back what archived or cancelled invoices had taken", () => {
		const balance = quoteBalance(quote, [
			invoice("void", "unpaid", [["sessions", 10, 800]], "2026-10-30"),
			invoice("cancelled", "cancelled", [["sessions", 10, 800]]),
		]);
		expect(balance.remaining).toBe(30000);
	});

	it("leaves out the invoice being checked", () => {
		const balance = quoteBalance(quote, [invoice("this", "draft", [["sessions", 30, 800]])], "this");
		expect(balance.lines[0].remaining).toBe(30);
	});
});

describe("beyondTheQuote", () => {
	const balance = quoteBalance(quote, [invoice("oct", "unpaid", [["sessions", 25, 800]])]);

	it("accepts what's left", () => {
		expect(beyondTheQuote(balance, [{ sourceLineId: "sessions", description: "Séance hôtel", quantity: 5, unitPrice: 800 }])).toBeNull();
	});

	it("refuses more sessions than are left, naming the line", () => {
		expect(beyondTheQuote(balance, [{ sourceLineId: "sessions", description: "Séance hôtel", quantity: 6, unitPrice: 800 }])).toBe(
			"“Séance hôtel”: 5\u00A0sessions left to invoice, this invoice has 6\u00A0sessions.",
		);
		const mats = beyondTheQuote(balance, [{ sourceLineId: "mats", description: "Location tapis", quantity: 61, unitPrice: 100 }]);
		expect(mats).toBe("“Location tapis”: 60 left to invoice, this invoice has 61.");
	});

	it("refuses more money than is left, even through a raised price or an extra line", () => {
		expect(
			beyondTheQuote(balance, [
				{ sourceLineId: "mats", description: "Location tapis", quantity: 60, unitPrice: 100 },
				{ sourceLineId: null, description: "Extra", quantity: 1, unitPrice: 4500 },
			]),
		).toMatch(/goes 500,00\u00A0MAD beyond/);
	});
});

describe("portions", () => {
	const balance = quoteBalance(quote, []);

	it("bills chosen quantities at the quotation's prices, selling what the quotation sold", () => {
		const lines = portionByQuantities(balance, { sessions: 10, mats: 0 });
		expect(lines).toEqual([
			{ sourceLineId: "sessions", description: "Séance hôtel", quantity: 10, unitPrice: 800, productId: "hotel", unit: "session" },
		]);
		expect(linesSubtotal(lines)).toBe(8000);
	});

	it("bills an amount as the same share of every line", () => {
		const lines = portionByAmount(balance, 10000);
		expect(lines.map((l) => l.quantity)).toEqual([10, 20]);
		expect(linesSubtotal(lines)).toBe(10000);
	});

	it("never bills more than what's left, whatever the amount", () => {
		expect(linesSubtotal(portionByAmount(balance, 99999))).toBe(30000);
	});
});
