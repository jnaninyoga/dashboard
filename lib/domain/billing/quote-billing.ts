// A quotation is billed over time: one invoice or many (this month's
// sessions, a share of the total), never more than was quoted. These rules
// are shared by the server (which enforces them) and the screens (which show
// what's billed and what's left), so the two never disagree.

import { type ProductUnit, quantityOf } from "@/lib/domain/price-list/product";
import { formatMoney } from "@/lib/utils/currency";

type Amount = number | string;

export type QuoteLine = {
	id: string;
	description: string;
	quantity: Amount;
	unitPrice: Amount;
	productId?: string | null;
	unit?: ProductUnit | null;
};

export type BillingInvoice = {
	id: string;
	status: string;
	archivedAt?: Date | string | null;
	lines?: { sourceLineId?: string | null; quantity: Amount; unitPrice: Amount }[] | null;
};

export type InvoiceLineInput = {
	sourceLineId?: string | null;
	description: string;
	quantity: Amount;
	unitPrice: Amount;
	productId?: string | null;
	unit?: ProductUnit | null;
};

export type QuoteLineBalance = {
	lineId: string;
	description: string;
	unitPrice: number;
	/** What the line sells from her price list, and what its quantity counts. */
	productId: string | null;
	unit: ProductUnit | null;
	ordered: number;
	billed: number;
	remaining: number;
};

export type QuoteBalance = {
	lines: QuoteLineBalance[];
	/** Before tax, like the lines. */
	quoted: number;
	billed: number;
	remaining: number;
};

// Money and quantities are compared in hundredths, as they're stored.
const cents = (n: Amount) => Math.round(Number(n) * 100);
const fromCents = (c: number) => c / 100;
const lineCents = (quantity: Amount, unitPrice: Amount) => Math.round(Number(quantity) * Number(unitPrice) * 100);

/**
 * Invoices that take from the quotation: issued ones and drafts (a draft is
 * already promised, and two drafts mustn't bill the same sessions), but not
 * archived or cancelled ones, which give their share back.
 */
export function billsTheQuote(invoice: BillingInvoice) {
	return !invoice.archivedAt && invoice.status !== "cancelled";
}

/** What each line of the quotation has had invoiced, and what's left, leaving out `exceptInvoiceId`. */
export function quoteBalance(quoteLines: QuoteLine[], invoices: BillingInvoice[], exceptInvoiceId?: string): QuoteBalance {
	const billedByLine = new Map<string, number>();
	let billedCents = 0;
	for (const invoice of invoices) {
		if (invoice.id === exceptInvoiceId || !billsTheQuote(invoice)) continue;
		for (const line of invoice.lines ?? []) {
			billedCents += lineCents(line.quantity, line.unitPrice);
			if (line.sourceLineId) {
				billedByLine.set(line.sourceLineId, (billedByLine.get(line.sourceLineId) ?? 0) + cents(line.quantity));
			}
		}
	}

	const lines = quoteLines.map((line) => {
		const ordered = cents(line.quantity);
		const billed = billedByLine.get(line.id) ?? 0;
		return {
			lineId: line.id,
			description: line.description,
			unitPrice: Number(line.unitPrice),
			productId: line.productId ?? null,
			unit: line.unit ?? null,
			ordered: fromCents(ordered),
			billed: fromCents(billed),
			remaining: fromCents(Math.max(0, ordered - billed)),
		};
	});
	const quotedCents = quoteLines.reduce((sum, line) => sum + lineCents(line.quantity, line.unitPrice), 0);
	return {
		lines,
		quoted: fromCents(quotedCents),
		billed: fromCents(billedCents),
		remaining: fromCents(Math.max(0, quotedCents - billedCents)),
	};
}

/** How a check speaks: of an invoice against its quotation, or of a credit note against its invoice. */
export type BillingWords = { verb: string; document: string; source: string };
const INVOICING: BillingWords = { verb: "invoice", document: "invoice", source: "quotation" };
export const CREDITING: BillingWords = { verb: "credit", document: "credit note", source: "invoice" };

/**
 * Why these lines can't be invoiced against the quotation (`balance` leaves
 * this invoice out), or null when they can: no line beyond what's left of
 * it, and no more money than the quotation, whatever the prices were
 * changed to. The same check holds a credit note to its invoice (`words`).
 */
export function beyondTheQuote(balance: QuoteBalance, invoiceLines: InvoiceLineInput[], words: BillingWords = INVOICING): string | null {
	const asked = new Map<string, number>();
	for (const line of invoiceLines) {
		if (!line.sourceLineId) continue;
		asked.set(line.sourceLineId, (asked.get(line.sourceLineId) ?? 0) + cents(line.quantity));
	}
	for (const [lineId, quantity] of asked) {
		const quoted = balance.lines.find((line) => line.lineId === lineId);
		if (!quoted) return `A line of this ${words.document} isn't on its ${words.source} any more.`;
		if (quantity > cents(quoted.remaining)) {
			return quoted.remaining > 0
				? `“${quoted.description}”: ${quantityOf(quoted.remaining, quoted.unit)} left to ${words.verb}, this ${words.document} has ${quantityOf(fromCents(quantity), quoted.unit)}.`
				: `“${quoted.description}” is already fully ${words.verb === "credit" ? "credited" : "invoiced"}.`;
		}
	}
	const total = invoiceLines.reduce((sum, line) => sum + lineCents(line.quantity, line.unitPrice), 0);
	if (total > cents(balance.remaining)) {
		const over = fromCents(total - cents(balance.remaining));
		return `This ${words.document} goes ${formatMoney(over)} beyond what's left of the ${words.source}.`;
	}
	return null;
}

/** An invoice's lines for chosen quantities of the quotation's lines (by line id); lines at 0 are left out. */
export function portionByQuantities(balance: QuoteBalance, quantities: Record<string, Amount>): InvoiceLineInput[] {
	return balance.lines
		.map((line) => ({
			sourceLineId: line.lineId,
			description: line.description,
			quantity: fromCents(cents(quantities[line.lineId] ?? 0)),
			unitPrice: line.unitPrice,
			productId: line.productId,
			unit: line.unit,
		}))
		.filter((line) => line.quantity > 0);
}

/**
 * An invoice's lines for an amount (before tax) of what's left: every line
 * keeps its price and gives the same share of what remains of it (10,000 of
 * a 30,000 quotation bills a third of each line). Quantities are rounded to
 * the hundredth, so the total can differ from `amount` by a few centimes.
 */
export function portionByAmount(balance: QuoteBalance, amount: Amount): InvoiceLineInput[] {
	const share = Math.min(1, Math.max(0, Number(amount) / balance.remaining || 0));
	return portionByQuantities(
		balance,
		Object.fromEntries(balance.lines.map((line) => [line.lineId, Math.round(line.remaining * share * 100) / 100])),
	);
}

/** Before-tax total of invoice lines, to the centime. */
export function linesSubtotal(lines: InvoiceLineInput[]) {
	return fromCents(lines.reduce((sum, line) => sum + lineCents(line.quantity, line.unitPrice), 0));
}
