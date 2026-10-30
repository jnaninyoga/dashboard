// An invoice's money as a story, oldest first: it was issued, then each
// payment came in (what was left after it), then it was settled, or it
// still waits (overdue once its due date has passed).

import { isOverdue } from "./payments";

type Amount = number | string;

export type LedgerInvoice = {
	type: string;
	status: string;
	issueDate: string;
	dueDate?: string | null;
	totalAmount: Amount;
	archivedAt?: Date | string | null;
	payments?: {
		id: string;
		amount: Amount;
		paymentDate: Date | string;
		createdAt?: Date | string;
		method?: string | null;
		reference?: string | null;
	}[] | null;
};

export type LedgerEntry =
	| { kind: "issued"; date: string; amount: number; dueDate: string | null }
	| { kind: "payment"; id: string; date: Date; amount: number; method: string | null; reference: string | null; left: number }
	| { kind: "settled"; date: Date | null }
	| { kind: "open"; left: number; dueDate: string | null; overdue: boolean };

const cents = (n: Amount) => Math.round(Number(n) * 100);

/** The entries of an issued invoice's story, in order. */
export function paymentLedger(invoice: LedgerInvoice, today: string): LedgerEntry[] {
	const total = cents(invoice.totalAmount);
	const payments = [...(invoice.payments ?? [])].sort(
		(a, b) =>
			new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime() ||
			new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
	);

	const entries: LedgerEntry[] = [
		{ kind: "issued", date: invoice.issueDate, amount: total / 100, dueDate: invoice.dueDate ?? null },
	];
	let left = total;
	for (const payment of payments) {
		left -= cents(payment.amount);
		entries.push({
			kind: "payment",
			id: payment.id,
			date: new Date(payment.paymentDate),
			amount: cents(payment.amount) / 100,
			method: payment.method ?? null,
			reference: payment.reference ?? null,
			left: Math.max(0, left) / 100,
		});
	}

	if (left <= 0 && payments.length) {
		entries.push({ kind: "settled", date: new Date(payments[payments.length - 1].paymentDate) });
	} else if (!invoice.archivedAt) {
		entries.push({ kind: "open", left: Math.max(0, left) / 100, dueDate: invoice.dueDate ?? null, overdue: isOverdue(invoice, today) });
	}
	return entries;
}
