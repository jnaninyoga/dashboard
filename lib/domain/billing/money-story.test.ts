import { describe, expect, it } from "vitest";

import { paymentLedger } from "./payment-ledger";
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
