// An invoice's money as a story, oldest first: it was issued, then each
// payment came in (what was left after it), a payment was undone (the
// cheque bounced: owed again), a credit note took part of it back, then it
// was settled, or it still waits (overdue once its due date has passed).
// Nothing is ever erased: an undone payment stays, marked as undone.

import { isOverdue } from "./payments";

type Amount = number | string;

export type LedgerRow = {
	id: string;
	amount: Amount;
	paymentDate: Date | string;
	createdAt?: Date | string;
	kind?: string | null;
	method?: string | null;
	reference?: string | null;
	reversesPaymentId?: string | null;
	reason?: string | null;
};

export type LedgerInvoice = {
	type: string;
	status: string;
	issueDate: string;
	dueDate?: string | null;
	totalAmount: Amount;
	archivedAt?: Date | string | null;
	payments?: LedgerRow[] | null;
};

export type LedgerEntry =
	| { kind: "issued"; date: string; amount: number; dueDate: string | null }
	| {
			kind: "payment";
			id: string;
			date: Date;
			amount: number;
			method: string | null;
			reference: string | null;
			left: number;
			/** When it was undone, if it was. */
			reversedOn: Date | null;
	  }
	| { kind: "reversal"; id: string; date: Date; amount: number; method: string | null; reason: string | null; left: number }
	| { kind: "credit"; id: string; date: Date; amount: number; reason: string | null; left: number }
	| { kind: "settled"; date: Date | null }
	| { kind: "open"; left: number; dueDate: string | null; overdue: boolean };

const cents = (n: Amount) => Math.round(Number(n) * 100);
const time = (d: Date | string | undefined) => new Date(d ?? 0).getTime();

/** The entries of an issued invoice's story, in order. */
export function paymentLedger(invoice: LedgerInvoice, today: string): LedgerEntry[] {
	const rows = [...(invoice.payments ?? [])].sort(
		(a, b) => time(a.paymentDate) - time(b.paymentDate) || time(a.createdAt) - time(b.createdAt),
	);
	const undone = new Map(
		rows.filter((row) => row.kind === "reversal" && row.reversesPaymentId).map((row) => [row.reversesPaymentId!, new Date(row.paymentDate)]),
	);

	const entries: LedgerEntry[] = [
		{ kind: "issued", date: invoice.issueDate, amount: cents(invoice.totalAmount) / 100, dueDate: invoice.dueDate ?? null },
	];
	let left = cents(invoice.totalAmount);
	let lastSettling: Date | null = null;
	for (const row of rows) {
		const amount = cents(row.amount);
		const date = new Date(row.paymentDate);
		if (row.kind === "reversal") {
			left += amount;
			entries.push({ kind: "reversal", id: row.id, date, amount: amount / 100, method: row.method ?? null, reason: row.reason ?? null, left: Math.max(0, left) / 100 });
			continue;
		}
		left -= amount;
		lastSettling = date;
		if (row.kind === "credit") {
			entries.push({ kind: "credit", id: row.id, date, amount: amount / 100, reason: row.reason ?? null, left: Math.max(0, left) / 100 });
		} else {
			entries.push({
				kind: "payment",
				id: row.id,
				date,
				amount: amount / 100,
				method: row.method ?? null,
				reference: row.reference ?? null,
				left: Math.max(0, left) / 100,
				reversedOn: undone.get(row.id) ?? null,
			});
		}
	}

	if (left <= 0 && lastSettling) {
		entries.push({ kind: "settled", date: lastSettling });
	} else if (!invoice.archivedAt) {
		entries.push({ kind: "open", left: Math.max(0, left) / 100, dueDate: invoice.dueDate ?? null, overdue: isOverdue(invoice, today) });
	}
	return entries;
}
