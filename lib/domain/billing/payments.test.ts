import { describe, expect, it } from "vitest";

import {
	allocatePayment,
	documentAmounts,
	isPayableInvoice,
	orderPaymentQueue,
	outstandingOf,
	owedSummary,
} from "./payments";

const inv = (id: string, documentNumber: string, totalAmount: number, amountPaid = 0) => ({
	id,
	documentNumber,
	totalAmount,
	amountPaid,
});

describe("isPayableInvoice", () => {
	it("accepts issued invoices that still owe money, including 'unpaid'", () => {
		for (const status of ["sent", "unpaid", "partially_paid"]) {
			expect(isPayableInvoice({ type: "invoice", status })).toBe(true);
		}
	});

	it("rejects quotes, drafts, paid, cancelled and archived invoices", () => {
		expect(isPayableInvoice({ type: "quote", status: "sent" })).toBe(false);
		expect(isPayableInvoice({ type: "invoice", status: "draft" })).toBe(false);
		expect(isPayableInvoice({ type: "invoice", status: "paid" })).toBe(false);
		expect(isPayableInvoice({ type: "invoice", status: "cancelled" })).toBe(false);
		expect(isPayableInvoice({ type: "invoice", status: "sent", archivedAt: new Date() })).toBe(false);
	});
});

describe("orderPaymentQueue", () => {
	it("puts the invoice being viewed first, then the rest oldest number first", () => {
		const queue = orderPaymentQueue("b", [
			inv("c", "FAC-2026-003", 100),
			inv("a", "FAC-2026-001", 100),
			inv("b", "FAC-2026-002", 100),
		]);
		expect(queue.map((q) => q.id)).toEqual(["b", "a", "c"]);
	});
});

describe("allocatePayment", () => {
	it("pays the viewed invoice first and spills the excess onto the next", () => {
		const queue = orderPaymentQueue("b", [inv("a", "FAC-1", 1000), inv("b", "FAC-2", 600)]);
		const result = allocatePayment(queue, 800);
		expect(result.map((r) => [r.id, r.applied, r.becomesPaid])).toEqual([
			["b", 600, true],
			["a", 200, false],
		]);
	});

	it("takes earlier payments into account", () => {
		const [only] = allocatePayment([inv("a", "FAC-1", 1000, 400)], 600);
		expect(only).toMatchObject({ due: 600, applied: 600, becomesPaid: true });
	});

	it("settles in centimes, so 0.1 + 0.2 style drift can't leave a cent owing", () => {
		const [only] = allocatePayment([inv("a", "FAC-1", 0.3, 0.1)], 0.2);
		expect(only.becomesPaid).toBe(true);
	});

	it("never applies more than what is owed, nor anything for zero or negative amounts", () => {
		expect(allocatePayment([inv("a", "FAC-1", 100)], 250)[0].applied).toBe(100);
		expect(allocatePayment([inv("a", "FAC-1", 100)], 0)[0].applied).toBe(0);
		expect(allocatePayment([inv("a", "FAC-1", 100)], -5)[0].applied).toBe(0);
	});

	it("skips invoices that are already settled", () => {
		const result = allocatePayment([inv("a", "FAC-1", 100, 100), inv("b", "FAC-2", 50)], 50);
		expect(result.map((r) => r.applied)).toEqual([0, 50]);
		expect(result[0].becomesPaid).toBe(false);
	});
});

describe("outstandingOf", () => {
	it("sums what is still owed across the queue, ignoring overpaid rows", () => {
		expect(outstandingOf([inv("a", "FAC-1", 1000, 400), inv("b", "FAC-2", 600), inv("c", "FAC-3", 100, 150)])).toBe(1200);
	});
});

describe("owedSummary", () => {
	it("adds up what each invoice still owes after its payments, to the centime", () => {
		const summary = owedSummary([
			{ totalAmount: "1000.10", payments: [{ amount: "400.05" }] },
			{ totalAmount: 600, payments: [] },
			// Settled to the centime: owes nothing, so it isn't counted.
			{ totalAmount: "0.30", payments: [{ amount: "0.10" }, { amount: "0.20" }] },
		]);
		expect(summary).toEqual({ amount: 1200.05, count: 2 });
	});

	it("never counts an overpaid invoice as negative", () => {
		expect(owedSummary([{ totalAmount: 100, payments: [{ amount: 150 }] }]).amount).toBe(0);
	});
});

describe("documentAmounts", () => {
	const invoice = (status: string, total: string, paid: string[] = []) => ({
		type: "invoice",
		status,
		totalAmount: total,
		payments: paid.map((amount) => ({ amount })),
	});

	it("shows what an issued invoice still owes", () => {
		expect(documentAmounts(invoice("partially_paid", "1000.00", ["400.00"]))).toEqual({ total: 1000, paid: 400, due: 600 });
	});

	it("owes nothing once paid, cancelled, or still a draft", () => {
		expect(documentAmounts(invoice("paid", "500.00", ["500.00"])).due).toBe(0);
		expect(documentAmounts(invoice("cancelled", "500.00")).due).toBe(0);
		expect(documentAmounts(invoice("draft", "500.00")).due).toBe(0);
	});

	it("never owes on a quotation (its invoices do)", () => {
		expect(documentAmounts({ type: "quote", status: "accepted", totalAmount: "900.00" })).toEqual({ total: 900, paid: 0, due: 0 });
	});

	it("adds in cents, so 0.10 + 0.20 leaves exactly 0.70 of 1.00", () => {
		expect(documentAmounts(invoice("unpaid", "1.00", ["0.10", "0.20"])).due).toBe(0.7);
	});
});
