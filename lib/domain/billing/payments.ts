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
export type DocumentStatusFilter = B2BDocumentStatus | typeof OWED_FILTER | "all";

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
