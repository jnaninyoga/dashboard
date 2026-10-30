import type { B2BDocumentStatus } from "@/lib/types/b2b";

// Issued invoices that can still receive money. Shared by the server
// allocator, the action ribbon and the payment dialog so they never disagree.
export const PAYABLE_INVOICE_STATUSES = [
	"sent",
	"unpaid",
	"partially_paid",
] as const satisfies readonly B2BDocumentStatus[];

// Filter value for "every invoice that can still receive money", whatever
// its exact status (an invoice confirmed directly stays "sent").
export const OWED_FILTER = "owed";
// Filter value for owed invoices past their due date.
export const OVERDUE_FILTER = "overdue";
export type DocumentStatusFilter = B2BDocumentStatus | typeof OWED_FILTER | typeof OVERDUE_FILTER | "all";

export function isPayableInvoice(doc: {
	type: string;
	status: string;
	archivedAt?: Date | string | null;
}): boolean {
	return (
		doc.type === "invoice" &&
		!doc.archivedAt &&
		(PAYABLE_INVOICE_STATUSES as readonly string[]).includes(doc.status)
	);
}

export type PaymentTarget = {
	id: string;
	documentNumber: string;
	totalAmount: number;
	amountPaid: number;
};

export type PaymentAllocation<T extends PaymentTarget> = T & {
	due: number;
	applied: number;
	becomesPaid: boolean;
};

// Amounts are settled in whole centimes so float drift can never decide
// whether an invoice is paid.
const toCents = (n: number) => Math.round(n * 100);
const fromCents = (c: number) => c / 100;

/**
 * The invoice the operator is looking at is paid first; any excess spills
 * over to the other open invoices of the same chain, oldest number first.
 */
export function orderPaymentQueue<T extends PaymentTarget>(
	currentId: string,
	invoices: T[],
): T[] {
	const current = invoices.filter((inv) => inv.id === currentId);
	const others = invoices
		.filter((inv) => inv.id !== currentId)
		.sort((a, b) => a.documentNumber.localeCompare(b.documentNumber));
	return [...current, ...others];
}

export function outstandingOf(queue: PaymentTarget[]): number {
	return fromCents(
		queue.reduce(
			(acc, q) => acc + Math.max(0, toCents(q.totalAmount) - toCents(q.amountPaid)),
			0,
		),
	);
}

export function allocatePayment<T extends PaymentTarget>(
	queue: T[],
	amount: number,
): PaymentAllocation<T>[] {
	let remaining = Math.max(0, toCents(amount));
	return queue.map((q) => {
		const dueCents = Math.max(0, toCents(q.totalAmount) - toCents(q.amountPaid));
		const appliedCents = Math.min(remaining, dueCents);
		remaining -= appliedCents;
		return {
			...q,
			due: fromCents(dueCents),
			applied: fromCents(appliedCents),
			becomesPaid: dueCents > 0 && appliedCents === dueCents,
		};
	});
}

type InvoiceWithPayments = {
	totalAmount: string | number;
	payments?: { amount: string | number }[] | null;
};

/** What a set of invoices still owes in total, and how many still owe anything. */
export function owedSummary(invoices: InvoiceWithPayments[]): { amount: number; count: number } {
	const owing = invoices
		.map((invoice) => {
			const paid = (invoice.payments ?? []).reduce((sum, p) => sum + toCents(Number(p.amount)), 0);
			return Math.max(0, toCents(Number(invoice.totalAmount)) - paid);
		})
		.filter((cents) => cents > 0);
	return { amount: fromCents(owing.reduce((a, b) => a + b, 0)), count: owing.length };
}

/**
 * A document's money at a glance: its total, what's been paid, and what it
 * still owes. Only an issued invoice that can still receive money owes
 * anything (the same rule as the payment dialog and the "owed" filter).
 */
export function documentAmounts(doc: {
	type: string;
	status: string;
	archivedAt?: Date | string | null;
	totalAmount: string | number;
	payments?: { amount: string | number }[] | null;
}): { total: number; paid: number; due: number } {
	const total = toCents(Number(doc.totalAmount));
	const paid = (doc.payments ?? []).reduce((sum, p) => sum + toCents(Number(p.amount)), 0);
	return {
		total: fromCents(total),
		paid: fromCents(paid),
		due: isPayableInvoice(doc) ? fromCents(Math.max(0, total - paid)) : 0,
	};
}

type StatusedDocument = {
	type: string;
	status: string;
	archivedAt?: Date | string | null;
	dueDate?: string | null;
};

/** An issued invoice past its due date (studio days, YYYY-MM-DD) that still owes money. */
export function isOverdue(doc: StatusedDocument, today: string): boolean {
	return isPayableInvoice(doc) && !!doc.dueDate && doc.dueDate < today;
}

/**
 * The status to show: an issued invoice reads "Unpaid" however it was issued
 * (older ones were left "sent"), and "Overdue" once its due date has passed;
 * a sent quotation past its validity reads "Expired" (it can still be accepted).
 */
export function displayStatus(doc: StatusedDocument, today: string): string {
	if (isOverdue(doc, today)) return "overdue";
	if (doc.type === "quote" && doc.status === "sent" && !doc.archivedAt && !!doc.dueDate && doc.dueDate < today) {
		return "expired";
	}
	if (doc.type === "invoice" && doc.status === "sent") return "unpaid";
	return doc.status;
}
