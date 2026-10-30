import { describe, expect, it } from "vitest";

import { paymentLedger } from "./payment-ledger";
import { documentAmounts, paidOf, settledOf, statusAfter } from "./payments";
import { quoteTape } from "./quote-tape";

const invoice = (
	id: string,
	status: string,
	total: number,
	paid: number[] = [],
	extra: Partial<{ issueDate: string; dueDate: string; archivedAt: string; documentNumber: string | null }> = {},
) => ({
	id,
	type: "invoice",
	status,
	documentNumber: `INV-${id}`,
	issueDate: "2026-10-01",
	dueDate: "2026-10-15",
	totalAmount: total,
	archivedAt: null,
	payments: paid.map((amount, i) => ({ id: `${id}-${i}`, amount, paymentDate: `2026-10-0${i + 2}T12:00:00Z` })),
	...extra,
});

describe("quoteTape", () => {
	it("cuts a quotation into its invoices, filled as they're paid", () => {
		const tape = quoteTape(
			30000,
			[
				invoice("b", "unpaid", 11000, [], { issueDate: "2026-10-20", dueDate: "2026-11-04" }),
				invoice("a", "paid", 8000, [5000, 3000]),
				invoice("c", "draft", 5000, [], { documentNumber: null }),
				invoice("void", "unpaid", 4000, [], { archivedAt: "2026-10-21" }),
			],
			"2026-10-30",
		);
		expect(tape.pieces.map((p) => [p.id, p.state])).toEqual([
			["a", "paid"],
			["b", "waiting"],
			["c", "draft"],
		]);
		expect(tape).toMatchObject({ quoted: 30000, invoiced: 19000, collected: 8000, waiting: 11000, overdue: 0, drafted: 5000, left: 6000 });
		expect(tape.pieces[0]).toMatchObject({ share: 8000 / 30000, filled: 1 });
		expect(tape.pieces[0].paidOn?.toISOString()).toBe("2026-10-03T12:00:00.000Z");
		expect(tape.pieces[2].name).toBe("Draft invoice");
	});

	it("tells what's overdue from what's merely waiting", () => {
		const tape = quoteTape(10000, [invoice("a", "partially_paid", 10000, [4000])], "2026-10-30");
		expect(tape.pieces[0]).toMatchObject({ state: "overdue", filled: 0.4, due: 6000 });
		expect(tape).toMatchObject({ overdue: 6000, waiting: 0, left: 0 });
	});
});

describe("paymentLedger", () => {
	it("tells an invoice's story: issued, each payment and what it left, settled", () => {
		const entries = paymentLedger(invoice("a", "paid", 8000, [5000, 3000]), "2026-10-30");
		expect(entries.map((e) => e.kind)).toEqual(["issued", "payment", "payment", "settled"]);
		expect(entries[1]).toMatchObject({ amount: 5000, left: 3000 });
		expect(entries[2]).toMatchObject({ amount: 3000, left: 0 });
	});

	it("ends on what's still owed, overdue once the due date has passed", () => {
		const open = paymentLedger(invoice("a", "partially_paid", 8000, [5000]), "2026-10-30").at(-1);
		expect(open).toEqual({ kind: "open", left: 3000, dueDate: "2026-10-15", overdue: true });
		const waiting = paymentLedger(invoice("a", "unpaid", 8000, [], { dueDate: "2026-11-30" }), "2026-10-30").at(-1);
		expect(waiting).toMatchObject({ kind: "open", left: 8000, overdue: false });
	});
});

describe("undone payments", () => {
	const bounced = {
		...invoice("a", "partially_paid", 8000, [5000, 3000]),
		dueDate: "2026-11-30",
	};
	// The 5 000 cheque bounced on 5 Oct: undone, not erased.
	bounced.payments = [
		...bounced.payments,
		{ id: "undo", amount: 5000, paymentDate: "2026-10-05T12:00:00Z", kind: "reversal", reversesPaymentId: "a-0", reason: "Cheque bounced" },
	] as typeof bounced.payments;

	it("keeps the payment, marked undone, and owes it again", () => {
		const entries = paymentLedger(bounced, "2026-10-30");
		expect(entries.map((e) => e.kind)).toEqual(["issued", "payment", "payment", "reversal", "open"]);
		expect(entries[1]).toMatchObject({ amount: 5000, reversedOn: new Date("2026-10-05T12:00:00Z") });
		expect(entries[3]).toMatchObject({ amount: 5000, left: 5000, reason: "Cheque bounced" });
		expect(entries.at(-1)).toMatchObject({ kind: "open", left: 5000, overdue: false });
	});

	it("counts it everywhere money is counted", () => {
		expect(paidOf(bounced.payments)).toBe(3000);
		expect(settledOf(bounced.payments)).toBe(3000);
		expect(documentAmounts(bounced)).toMatchObject({ total: 8000, paid: 3000, due: 5000 });
		expect(statusAfter(8000, 3000)).toBe("partially_paid");
		expect(statusAfter(8000, 0)).toBe("unpaid");
		expect(statusAfter(8000, 8000)).toBe("paid");
	});

	it("settles with a credit note like with a payment", () => {
		const rows = [
			{ amount: 6000, kind: "payment" },
			{ amount: 2000, kind: "credit" },
		];
		expect(settledOf(rows)).toBe(8000);
		expect(paidOf(rows)).toBe(6000);
	});
});
