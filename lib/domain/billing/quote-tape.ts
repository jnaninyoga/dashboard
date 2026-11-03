// A quotation's money as one strip of tape: each invoice is a piece cut
// from it (in the order they were issued), filled as it's paid; what isn't
// invoiced yet is the rest of the roll. The quotation page, the invoice page
// and their lists all draw this same picture.

import { documentName } from "./document-name";
import { displayStatus, documentAmounts } from "./payments";
import { billsTheQuote } from "./quote-billing";

type Amount = number | string;

export type TapeInvoice = {
	id: string;
	type: string;
	status: string;
	documentNumber: string | null;
	issueDate: string;
	dueDate?: string | null;
	totalAmount: Amount;
	archivedAt?: Date | string | null;
	payments?: { amount: Amount; paymentDate: Date | string }[] | null;
};

/** Where a piece stands: paid, partly paid, waiting for payment, overdue, or still a draft. */
export type PieceState = "paid" | "partly" | "waiting" | "overdue" | "draft";

export type TapePiece = {
	id: string;
	name: string;
	state: PieceState;
	total: number;
	paid: number;
	due: number;
	issueDate: string;
	dueDate: string | null;
	/** The day it was paid in full, if it was. */
	paidOn: Date | null;
	/** Its length on the tape (a share of the quotation). */
	share: number;
	/** How much of it is filled (paid). */
	filled: number;
};

export type QuoteTape = {
	quoted: number;
	/** Issued invoices. */
	invoiced: number;
	collected: number;
	waiting: number;
	overdue: number;
	/** Drafts not issued yet. */
	drafted: number;
	/** Not invoiced at all yet. */
	left: number;
	pieces: TapePiece[];
};

const cents = (n: Amount) => Math.round(Number(n) * 100);
const fromCents = (c: number) => c / 100;

function stateOf(invoice: TapeInvoice, today: string): PieceState {
	if (invoice.status === "draft") return "draft";
	const status = displayStatus(invoice, today);
	if (status === "paid") return "paid";
	if (status === "overdue") return "overdue";
	if (status === "partially_paid") return "partly";
	return "waiting";
}

/** The tape of a quotation (`quoted` with tax, like its invoices) and its invoices, as of `today`. */
export function quoteTape(quoted: Amount, invoices: TapeInvoice[], today: string): QuoteTape {
	const counted = invoices
		.filter(billsTheQuote)
		// Issued ones in the order they were issued; drafts come last.
		.sort((a, b) => {
			if ((a.status === "draft") !== (b.status === "draft")) return a.status === "draft" ? 1 : -1;
			return a.issueDate.localeCompare(b.issueDate) || (a.documentNumber ?? "").localeCompare(b.documentNumber ?? "");
		});
	const quotedCents = cents(quoted);
	const length = Math.max(quotedCents, counted.reduce((sum, invoice) => sum + cents(invoice.totalAmount), 0), 1);

	const totals = { invoiced: 0, collected: 0, waiting: 0, overdue: 0, drafted: 0 };
	const pieces = counted.map((invoice) => {
		const state = stateOf(invoice, today);
		const { total, paid, due } = documentAmounts(invoice);
		const payments = [...(invoice.payments ?? [])].sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
		if (state === "draft") totals.drafted += cents(total);
		else {
			totals.invoiced += cents(total);
			totals.collected += cents(paid);
			totals[state === "overdue" ? "overdue" : "waiting"] += cents(due);
		}
		return {
			id: invoice.id,
			name: documentName(invoice),
			state,
			total,
			paid,
			due,
			issueDate: invoice.issueDate,
			dueDate: invoice.dueDate ?? null,
			paidOn: state === "paid" && payments.length ? new Date(payments[payments.length - 1].paymentDate) : null,
			share: cents(total) / length,
			filled: total > 0 ? Math.min(1, paid / total) : 0,
		};
	});

	return {
		quoted: fromCents(quotedCents),
		invoiced: fromCents(totals.invoiced),
		collected: fromCents(totals.collected),
		waiting: fromCents(totals.waiting),
		overdue: fromCents(totals.overdue),
		drafted: fromCents(totals.drafted),
		left: fromCents(Math.max(0, quotedCents - totals.invoiced - totals.drafted)),
		pieces,
	};
}
