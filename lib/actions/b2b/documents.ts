"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import {
	allocatePayment,
	type DocumentStatusFilter,
	isPayableInvoice,
	orderPaymentQueue,
	outstandingOf,
	OVERDUE_FILTER,
	OWED_FILTER,
	PAYABLE_INVOICE_STATUSES,
} from "@/lib/domain/billing/payments";
import {
	beyondTheQuote,
	type InvoiceLineInput,
	portionByAmount,
	portionByQuantities,
	quoteBalance,
} from "@/lib/domain/billing/quote-billing";
import { mergeSameLines } from "@/lib/domain/billing/same-lines";
import { logServerError } from "@/lib/errors/server";
import { B2BDocumentStatus, B2BDocumentType, type DocumentWithRelations } from "@/lib/types/b2b";
import { parseAmountInput } from "@/lib/utils/currency";
import { addDays, fromStudioTime, studioDateString } from "@/lib/utils/time";
import {
	createDocumentWithLinesSchema,
	documentLinesSchema,
	recordPaymentSchema,
} from "@/lib/validators";
import { db } from "@/services/database";
import {
	b2bDocumentLines,
	b2bDocuments,
	b2bDocumentSequences,
	b2bPartners,
	b2bPayments,
} from "@/services/database/schema";

import { and, asc, desc, eq, ilike, inArray, isNull, lt, not, or, sql } from "drizzle-orm";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// 2-decimal banker's-style rounding for MAD amounts. Centralised so every
// totals calculation produces consistent values for the audit trail.
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// We require *some* numeric tax id on the partner before issuing an invoice.
// Length isn't enforced — partners outside Morocco may use shorter formats,
// and Odoo doesn't strict it either. Spaces / dashes are tolerated.
const isValidIce = (s: string | null | undefined): boolean => {
	if (typeof s !== "string") return false;
	return s.replace(/\D/g, "").length > 0;
};

// An invoice is due this many days after it's issued, unless its draft said otherwise.
const DEFAULT_PAYMENT_DAYS = 15;

const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

type LineInput = { quantity: number | string; unitPrice: number | string };

/**
 * Server-recomputes line.totalPrice, document subtotal, and document total
 * from the trusted (qty, unitPrice, taxRate) inputs. Client-supplied totals
 * are ignored — totals on a posted document must always match the lines.
 */
function computeTotals(lines: LineInput[], taxRate: number | string) {
	const tax = Number(taxRate);
	const linesPriced = lines.map((line) => {
		const qty = Number(line.quantity);
		const unit = Number(line.unitPrice);
		return { quantity: qty, unitPrice: unit, totalPrice: round2(qty * unit) };
	});
	const subtotal = round2(linesPriced.reduce((acc, l) => acc + l.totalPrice, 0));
	const totalAmount = round2(subtotal * (1 + tax / 100));
	return { lines: linesPriced, subtotal, taxRate: tax, totalAmount };
}

/** Rows for b2b_document_lines, in the order given, totals recomputed. */
function lineRows(documentId: string, lines: (InvoiceLineInput & { sourceLineId?: string | null })[], taxRate: number | string) {
	const computed = computeTotals(lines, taxRate);
	return {
		computed,
		rows: lines.map((line, i) => ({
			documentId,
			sourceLineId: line.sourceLineId ?? null,
			description: line.description.trim(),
			quantity: computed.lines[i].quantity.toString(),
			unitPrice: computed.lines[i].unitPrice.toFixed(2),
			totalPrice: computed.lines[i].totalPrice.toFixed(2),
			position: i,
		})),
	};
}

const linesInOrder = [asc(b2bDocumentLines.position), asc(b2bDocumentLines.createdAt)];

export type ActionState = {
	error?: string;
	/** Code the failure was logged under; shown in the error toast. */
	ref?: string;
	success?: boolean;
	issues?: Record<string, string[] | undefined>;
	id?: string;
};

/**
 * Reserve the next document number for (type, year of `date`) using
 * b2b_document_sequences with row-level locking (SELECT … FOR UPDATE) inside
 * the caller's transaction. Two concurrent numberings cannot collide.
 */
async function reserveNextDocumentNumber(
	tx: DbTx,
	type: B2BDocumentType,
	date: string,
): Promise<string> {
	const prefix = type === "quote" ? "QUO" : "INV";
	const year = Number(date.slice(0, 4));

	// First-touch insert; ignored if the row already exists.
	await tx
		.insert(b2bDocumentSequences)
		.values({ type, year, nextValue: 1 })
		.onConflictDoNothing();

	// Lock the row, read current value, then bump it.
	const locked = await tx.execute<{ next_value: number }>(sql`
		SELECT "next_value" FROM "b2b_document_sequences"
		WHERE "type" = ${type} AND "year" = ${year}
		FOR UPDATE
	`);
	const current = Number(locked[0]?.next_value ?? 1);

	await tx
		.update(b2bDocumentSequences)
		.set({ nextValue: current + 1 })
		.where(
			and(
				eq(b2bDocumentSequences.type, type),
				eq(b2bDocumentSequences.year, year),
			),
		);

	return `${prefix}-${year}-${current.toString().padStart(4, "0")}`;
}

/**
 * Read-only preview of the next number for (type, this year). Does NOT
 * consume the sequence — safe to call on every render of the create page.
 * If another document is numbered in the meantime, the saved number is one
 * higher than the preview, which is fine.
 */
export async function peekNextDocumentNumber(
	type: B2BDocumentType,
): Promise<string> {
	await requireUser();
	const prefix = type === "quote" ? "QUO" : "INV";
	const year = Number(studioDateString().slice(0, 4));

	const row = await db.query.b2bDocumentSequences.findFirst({
		where: and(
			eq(b2bDocumentSequences.type, type),
			eq(b2bDocumentSequences.year, year),
		),
	});

	const next = row?.nextValue ?? 1;
	return `${prefix}-${year}-${next.toString().padStart(4, "0")}`;
}

/**
 * A new draft. A quotation takes its number now; an invoice gets one only
 * when it's issued. Whatever the form sends, a new document starts as a
 * draft of its own (no status, no parent from the browser).
 */
export async function createDocumentAction(
	_prevState: ActionState | null,
	data: unknown
): Promise<ActionState> {
	await requireUser();
	const validated = createDocumentWithLinesSchema.safeParse(data);

	if (!validated.success) {
		return {
			error: "Validation failed",
			issues: validated.error.flatten().fieldErrors,
		};
	}

	const { document } = validated.data;
	const lines = mergeSameLines(validated.data.lines);

	try {
		let newId: string;
		await db.transaction(async (tx) => {
			const documentNumber =
				document.type === "quote"
					? await reserveNextDocumentNumber(tx, "quote", document.issueDate)
					: null;
			const { computed, rows } = lineRows("", lines, document.taxRate);

			const [newDoc] = await tx
				.insert(b2bDocuments)
				.values({
					partnerId: document.partnerId,
					contactId: document.contactId ?? null,
					type: document.type,
					status: "draft",
					documentNumber,
					issueDate: document.issueDate,
					dueDate: document.dueDate || null,
					notes: document.notes ?? null,
					subtotal: computed.subtotal.toFixed(2),
					taxRate: computed.taxRate.toFixed(2),
					totalAmount: computed.totalAmount.toFixed(2),
				})
				.returning();

			newId = newDoc.id;
			await tx.insert(b2bDocumentLines).values(rows.map((row) => ({ ...row, documentId: newDoc.id })));
		});

		revalidatePath(`/b2b/partners/${document.partnerId}`);
		revalidatePath("/b2b/documents");
		// @ts-expect-error - newId is assigned in transaction
		return { success: true, id: newId };
	} catch (error) {
		return { error: "Failed to create document", ref: logServerError("Error creating B2B document", error) };
	}
}

class RefusedError extends Error {}

/**
 * Issues a draft, all or nothing: the draft is locked (a double click can't
 * issue it twice), must have lines and a total, and an invoice must have the
 * partner's ICE and stay within what's left of its quotation. It's dated the
 * day it's issued (the payment term it had is kept), and an invoice takes
 * the next number then, so invoice numbers follow the order of issue.
 */
async function issueDraft(tx: DbTx, id: string) {
	const [doc] = await tx.select().from(b2bDocuments).where(eq(b2bDocuments.id, id)).for("update");
	if (!doc) throw new RefusedError("Document not found");
	if (doc.archivedAt) throw new RefusedError("Archived documents cannot change status");
	if (doc.status !== "draft") throw new RefusedError("This document is already issued.");

	const lines = await tx.select().from(b2bDocumentLines).where(eq(b2bDocumentLines.documentId, id));
	if (!lines.length) throw new RefusedError("Add at least one line before issuing it.");
	if (!(Number(doc.totalAmount) > 0)) {
		throw new RefusedError("It comes to 0 MAD: give its lines a price before issuing it.");
	}

	if (doc.type === "invoice") {
		const partner = await tx.query.b2bPartners.findFirst({ where: eq(b2bPartners.id, doc.partnerId) });
		if (!isValidIce(partner?.taxId)) {
			throw new RefusedError("Add the partner's ICE (Tax ID) before issuing this invoice.");
		}
		if (doc.parentDocumentId) {
			// The quotation is locked too, so two of its invoices can't be issued
			// at once past what's left of it.
			await tx.select({ id: b2bDocuments.id }).from(b2bDocuments).where(eq(b2bDocuments.id, doc.parentDocumentId)).for("update");
			const quoteLines = await tx.select().from(b2bDocumentLines).where(eq(b2bDocumentLines.documentId, doc.parentDocumentId));
			const siblings = await tx.query.b2bDocuments.findMany({
				where: and(eq(b2bDocuments.parentDocumentId, doc.parentDocumentId), eq(b2bDocuments.type, "invoice")),
				with: { lines: true },
			});
			const problem = beyondTheQuote(quoteBalance(quoteLines, siblings, id), lines);
			if (problem) throw new RefusedError(problem);
		}
	}

	const today = studioDateString();
	const term = doc.dueDate
		? Math.max(0, daysBetween(doc.issueDate, doc.dueDate))
		: doc.type === "invoice"
			? DEFAULT_PAYMENT_DAYS
			: null;
	await tx
		.update(b2bDocuments)
		.set({
			status: doc.type === "invoice" ? "unpaid" : "sent",
			documentNumber: doc.documentNumber ?? (await reserveNextDocumentNumber(tx, doc.type, today)),
			issueDate: today,
			dueDate: term === null ? null : addDays(today, term),
			updatedAt: new Date(),
		})
		.where(eq(b2bDocuments.id, id));
	return doc;
}

/**
 * The status changes she makes by hand: issuing a draft ("Mark as sent")
 * and accepting a sent quotation. Payments move invoices on from there;
 * archiving retires a document.
 */
export async function updateDocumentStatusAction(
	id: string,
	status: B2BDocumentStatus,
	partnerId?: string
): Promise<ActionState> {
	await requireUser();
	try {
		const doc = await db.query.b2bDocuments.findFirst({
			where: eq(b2bDocuments.id, id),
		});
		if (!doc) return { error: "Document not found" };
		if (doc.archivedAt) return { error: "Archived documents cannot change status" };

		if (doc.status === "draft" && (status === "sent" || status === "unpaid")) {
			await db.transaction((tx) => issueDraft(tx, id));
		} else if (doc.type === "quote" && doc.status === "sent" && status === "accepted") {
			await db
				.update(b2bDocuments)
				.set({ status, updatedAt: new Date() })
				.where(and(eq(b2bDocuments.id, id), eq(b2bDocuments.status, "sent")));
		} else {
			return { error: `A ${doc.status} ${doc.type} can't become ${status}.` };
		}

		if (partnerId ?? doc.partnerId) revalidatePath(`/b2b/partners/${partnerId ?? doc.partnerId}`);
		revalidatePath("/b2b/documents");
		revalidatePath(`/b2b/documents/${id}`);
		if (doc.parentDocumentId) revalidatePath(`/b2b/documents/${doc.parentDocumentId}`);

		return { success: true };
	} catch (error) {
		if (error instanceof RefusedError) return { error: error.message };
		return { error: "Failed to update status", ref: logServerError("Error updating document status", error) };
	}
}

/**
 * Archive an issued document (soft-hide). The row, its number, and its history
 * are preserved — required for an audit-grade trail. Drafts use deleteDocumentAction.
 * An archived invoice gives back what it had billed of its quotation.
 */
export async function archiveDocumentAction(
	id: string,
	reason?: string,
	partnerId?: string,
): Promise<ActionState> {
	await requireUser();
	try {
		const doc = await db.query.b2bDocuments.findFirst({
			where: eq(b2bDocuments.id, id),
		});
		if (!doc) return { error: "Document not found" };
		if (doc.status === "draft") {
			return { error: "Drafts should be deleted, not archived" };
		}
		if (doc.archivedAt) return { error: "Document is already archived" };

		await db
			.update(b2bDocuments)
			.set({
				archivedAt: new Date(),
				archivedReason: reason?.trim() || null,
				updatedAt: new Date(),
			})
			.where(eq(b2bDocuments.id, id));

		if (partnerId) revalidatePath(`/b2b/partners/${partnerId}`);
		revalidatePath("/b2b/documents");
		revalidatePath(`/b2b/documents/${id}`);
		if (doc.parentDocumentId) revalidatePath(`/b2b/documents/${doc.parentDocumentId}`);

		return { success: true };
	} catch (error) {
		return { error: "Failed to archive document", ref: logServerError("Error archiving document", error) };
	}
}

export async function unarchiveDocumentAction(
	id: string,
	partnerId?: string,
): Promise<ActionState> {
	await requireUser();
	try {
		const doc = await db.query.b2bDocuments.findFirst({
			where: eq(b2bDocuments.id, id),
			with: { lines: true },
		});
		if (!doc) return { error: "Document not found" };
		if (!doc.archivedAt) return { error: "Document is not archived" };

		// Restoring an invoice takes its share of the quotation back: only if
		// it's still there to take.
		if (doc.type === "invoice" && doc.parentDocumentId) {
			const quoteLines = await db.select().from(b2bDocumentLines).where(eq(b2bDocumentLines.documentId, doc.parentDocumentId));
			const siblings = await db.query.b2bDocuments.findMany({
				where: and(eq(b2bDocuments.parentDocumentId, doc.parentDocumentId), eq(b2bDocuments.type, "invoice")),
				with: { lines: true },
			});
			const problem = beyondTheQuote(quoteBalance(quoteLines, siblings, doc.id), doc.lines);
			if (problem) return { error: `Can't restore it: ${problem}` };
		}

		await db
			.update(b2bDocuments)
			.set({ archivedAt: null, archivedReason: null, updatedAt: new Date() })
			.where(eq(b2bDocuments.id, id));

		if (partnerId) revalidatePath(`/b2b/partners/${partnerId}`);
		revalidatePath("/b2b/documents");
		revalidatePath(`/b2b/documents/${id}`);

		return { success: true };
	} catch (error) {
		return { error: "Failed to restore document", ref: logServerError("Error restoring document", error) };
	}
}

export async function getDocumentsAction(filters?: {
	query?: string;
	type?: B2BDocumentType | "all";
	status?: DocumentStatusFilter;
	isBackorder?: boolean | "all";
	includeArchived?: boolean;
}): Promise<{ documents?: DocumentWithRelations[]; error?: string; ref?: string }> {
	await requireUser();
	const { query, type, status, includeArchived } = filters || {};

	try {
		const documents = (await db.query.b2bDocuments.findMany({
			where: (docs, { isNull }) => {
				const conditions = [];

				if (!includeArchived) {
					conditions.push(isNull(docs.archivedAt));
				}

				// A number, words from the notes, or the partner's name.
				if (query) {
					conditions.push(
						or(
							ilike(docs.documentNumber, `%${query}%`),
							ilike(docs.notes, `%${query}%`),
							inArray(
								docs.partnerId,
								db
									.select({ id: b2bPartners.id })
									.from(b2bPartners)
									.where(ilike(b2bPartners.companyName, `%${query}%`)),
							),
						),
					);
				}

				if (type && type !== "all") {
					conditions.push(eq(docs.type, type));
				}

				if (status === OWED_FILTER || status === OVERDUE_FILTER) {
					conditions.push(
						eq(docs.type, "invoice"),
						inArray(docs.status, [...PAYABLE_INVOICE_STATUSES]),
					);
					if (status === OVERDUE_FILTER) conditions.push(lt(docs.dueDate, studioDateString()));
				} else if (status && status !== "all") {
					conditions.push(eq(docs.status, status));
				}

				if (filters?.isBackorder && filters.isBackorder !== "all") {
					conditions.push(
						and(
							eq(docs.type, "invoice"),
							sql`${docs.parentDocumentId} IS NOT NULL`
						)
					);
				}

				return conditions.length > 0 ? and(...conditions) : undefined;
			},
			with: {
				partner: true,
				contact: true,
				payments: true,
				parent: true,
			},
			orderBy: [desc(b2bDocuments.issueDate), desc(b2bDocuments.createdAt)],
		})) as DocumentWithRelations[];

		return { documents };

	} catch (error) {
		return { error: "Failed to fetch documents", ref: logServerError("Error fetching documents", error) };
	}
}

export async function getDocumentByIdAction(id: string): Promise<{ document?: DocumentWithRelations; accountSummary?: { previousInvoices: DocumentWithRelations[], allRelatedInvoices?: DocumentWithRelations[], chainInvoices?: DocumentWithRelations[] }; error?: string; ref?: string }> {
	await requireUser();
	try {
		const document = (await db.query.b2bDocuments.findFirst({
			where: eq(b2bDocuments.id, id),
			with: {
				partner: {
					with: {
						contacts: true,
					},
				},
				contact: true,
				lines: { orderBy: linesInOrder },
				parent: {
					with: {
						lines: { orderBy: linesInOrder },
					},
				},
				// A quotation's invoices, with their lines: what's billed and what's left.
				children: {
					with: { lines: true, payments: true },
					orderBy: [asc(b2bDocuments.createdAt)],
				},
				payments: {
					orderBy: [desc(b2bPayments.paymentDate)],
				},
			},
		})) as DocumentWithRelations | null;

		if (!document) return { error: "Document not found" };

		// Fetch related invoices for fulfillment tracking and account summary
		let previousInvoices: DocumentWithRelations[] = [];
		if (document.type === "invoice" && document.parentDocumentId) {
			previousInvoices = await db.query.b2bDocuments.findMany({
				where: (docs, { isNull }) => and(
					eq(docs.partnerId, document.partnerId),
					eq(docs.type, "invoice"),
					eq(docs.parentDocumentId!, document.parentDocumentId!),
					not(eq(docs.status, "cancelled")),
					isNull(docs.archivedAt),
				),
				with: {
					lines: true,
					payments: {
						orderBy: [desc(b2bPayments.paymentDate)],
					},
				},
				orderBy: asc(b2bDocuments.createdAt),
			});

			// Filter for the UI (Statement of Account only shows unpaid invoices created BEFORE this one)
			const statementInvoices = previousInvoices.filter(inv =>
				inv.id !== document.id &&
				(["sent", "unpaid", "partially_paid"] as string[]).includes(inv.status) &&
				new Date(inv.createdAt).getTime() < new Date(document.createdAt).getTime()
			).map(inv => ({ ...inv, isSibling: true }));

			return {
				document,
				accountSummary: {
					previousInvoices: statementInvoices,
					// Sibling invoices (the current one left out: its lines are
					// read from `doc.lines`).
					allRelatedInvoices: previousInvoices.filter(
						(inv) => inv.id !== document.id,
					),
					// Full chain (incl. current) for the AccountStatement view.
					chainInvoices: previousInvoices,
				},
			};
		}

		return {
			document,
			accountSummary: {
				previousInvoices: [],
				chainInvoices: [],
			}
		};

	} catch (error) {
		return { error: "Failed to fetch document", ref: logServerError("Error fetching document", error) };
	}
}

/** What part of a quotation an invoice bills. */
export type InvoicePortion =
	| { kind: "remaining" }
	| { kind: "quantities"; quantities: Record<string, string> }
	| { kind: "amount"; amount: string };

/**
 * A draft invoice for a portion of a sent or accepted quotation: everything
 * left, chosen quantities of its lines, or an amount (before tax) spread
 * over what's left. Never more than what's left (drafts already made count),
 * at the quotation's prices and tax. Invoicing a sent quotation accepts it.
 */
export async function createInvoiceFromQuoteAction(
	quoteId: string,
	portion: InvoicePortion = { kind: "remaining" },
): Promise<ActionState> {
	await requireUser();
	try {
		let newId = "";
		let partnerId = "";
		await db.transaction(async (tx) => {
			// One invoice at a time per quotation: what's left can't be taken twice.
			const [quote] = await tx.select().from(b2bDocuments).where(eq(b2bDocuments.id, quoteId)).for("update");
			if (!quote || quote.type !== "quote") throw new RefusedError("Quotation not found");
			if (quote.archivedAt) throw new RefusedError("This quotation is archived.");
			if (quote.status !== "sent" && quote.status !== "accepted") {
				throw new RefusedError("Mark the quotation as sent before invoicing it.");
			}
			partnerId = quote.partnerId;

			const quoteLines = await tx.select().from(b2bDocumentLines).where(eq(b2bDocumentLines.documentId, quoteId)).orderBy(...linesInOrder);
			const invoices = await tx.query.b2bDocuments.findMany({
				where: and(eq(b2bDocuments.parentDocumentId, quoteId), eq(b2bDocuments.type, "invoice")),
				with: { lines: true },
			});
			const balance = quoteBalance(quoteLines, invoices);
			if (balance.remaining <= 0) throw new RefusedError("This quotation is already fully invoiced.");

			const lines =
				portion.kind === "quantities"
					? portionByQuantities(balance, portion.quantities)
					: portion.kind === "amount"
						? portionByAmount(balance, parseAmountInput(portion.amount))
						: portionByQuantities(
								balance,
								Object.fromEntries(balance.lines.map((line) => [line.lineId, line.remaining])),
							);
			if (!lines.length) throw new RefusedError("Choose what to invoice: a quantity or an amount.");
			const problem = beyondTheQuote(balance, lines);
			if (problem) throw new RefusedError(problem);

			const today = studioDateString();
			const { computed, rows } = lineRows("", lines, quote.taxRate);
			const [invoice] = await tx
				.insert(b2bDocuments)
				.values({
					partnerId: quote.partnerId,
					contactId: quote.contactId,
					type: "invoice",
					status: "draft",
					// Numbered when it's issued.
					documentNumber: null,
					issueDate: today,
					dueDate: addDays(today, DEFAULT_PAYMENT_DAYS),
					subtotal: computed.subtotal.toFixed(2),
					taxRate: computed.taxRate.toFixed(2),
					totalAmount: computed.totalAmount.toFixed(2),
					// Her terms and bank details carry over from the quotation.
					notes: quote.notes,
					parentDocumentId: quoteId,
				})
				.returning();
			newId = invoice.id;
			await tx.insert(b2bDocumentLines).values(rows.map((row) => ({ ...row, documentId: invoice.id })));

			if (quote.status === "sent") {
				await tx
					.update(b2bDocuments)
					.set({ status: "accepted", updatedAt: new Date() })
					.where(eq(b2bDocuments.id, quoteId));
			}
		});

		revalidatePath(`/b2b/partners/${partnerId}`);
		revalidatePath("/b2b/documents");
		revalidatePath(`/b2b/documents/${quoteId}`);
		return { success: true, id: newId };
	} catch (error) {
		if (error instanceof RefusedError) return { error: error.message };
		return { error: "Failed to create the invoice", ref: logServerError("Error invoicing a quotation", error) };
	}
}

/**
 * Money received from a partner, on the day it arrived, with how it was
 * paid. The invoice she's looking at is paid first; any excess goes to the
 * other open invoices of the same quotation, oldest first. Never more than
 * they owe.
 */
export async function recordDocumentPaymentAction(
	id: string,
	payment: unknown,
	partnerId?: string,
	requestId?: string,
): Promise<ActionState> {
	await requireUser();
	try {
		const parsed = recordPaymentSchema.safeParse(payment);
		if (!parsed.success) {
			return { error: parsed.error.issues[0]?.message ?? "Check the payment", issues: parsed.error.flatten().fieldErrors };
		}
		const { amountPaid, paymentDate, method, reference } = parsed.data;
		if (paymentDate > studioDateString()) {
			return { error: "The payment date can't be in the future." };
		}

		const doc = await db.query.b2bDocuments.findFirst({
			where: eq(b2bDocuments.id, id),
		});

		if (!doc) return { error: "Document not found" };
		if (!isPayableInvoice(doc)) return { error: "Only an issued, unpaid invoice can receive a payment." };

		const amount = round2(parseAmountInput(amountPaid));
		if (!Number.isFinite(amount) || amount <= 0) {
			return { error: "Enter a positive amount" };
		}

		// Idempotency short-circuit: if a payment with this requestId already
		// exists, treat the call as a no-op success. The b2b_payments.request_id
		// UNIQUE index also catches the race between this read and the insert.
		if (requestId) {
			const existing = await db.query.b2bPayments.findFirst({
				where: eq(b2bPayments.requestId, requestId),
			});
			if (existing) {
				return { success: true };
			}
		}

		await db.transaction(async (tx) => {
			// Scope: this invoice, or every invoice billed from the same quote.
			// Archived rows are excluded — they no longer count toward the
			// partner's outstanding balance.
			const scope = and(
				eq(b2bDocuments.partnerId, partnerId || doc.partnerId),
				eq(b2bDocuments.type, "invoice"),
				inArray(b2bDocuments.status, [...PAYABLE_INVOICE_STATUSES]),
				doc.parentDocumentId
					? eq(b2bDocuments.parentDocumentId, doc.parentDocumentId)
					: eq(b2bDocuments.id, doc.id),
				isNull(b2bDocuments.archivedAt),
			);

			// Serialise concurrent payments on the same chain so two submits
			// can't both see the same balance and over-allocate.
			await tx
				.select({ id: b2bDocuments.id })
				.from(b2bDocuments)
				.where(scope)
				.for("update");

			const openInvoices = await tx.query.b2bDocuments.findMany({
				where: scope,
				with: { payments: true },
			});

			const queue = orderPaymentQueue(
				doc.id,
				openInvoices.map((inv) => ({
					id: inv.id,
					documentNumber: inv.documentNumber ?? "",
					totalAmount: Number(inv.totalAmount),
					amountPaid: (inv.payments || []).reduce(
						(s, p) => s + Number(p.amount),
						0,
					),
				})),
			);

			// Reject overpayment: the operator must record exactly what was
			// received, never more. Solo-operator rule: no partner credits, no
			// silent prepayments — keep the model simple.
			const totalOutstanding = outstandingOf(queue);
			if (amount > totalOutstanding) {
				throw new OverpaymentError(totalOutstanding);
			}

			let isFirstRow = true;
			for (const allocation of allocatePayment(queue, amount)) {
				if (allocation.applied <= 0) continue;

				const newStatus: B2BDocumentStatus = allocation.becomesPaid
					? "paid"
					: "partially_paid";

				await tx
					.update(b2bDocuments)
					.set({ status: newStatus, updatedAt: new Date() })
					.where(eq(b2bDocuments.id, allocation.id));

				// Tag the first allocation row with the requestId so the UNIQUE
				// index dedupes concurrent retries of the same submit.
				await tx.insert(b2bPayments).values({
					documentId: allocation.id,
					amount: allocation.applied.toFixed(2),
					// Midday at the studio, so the day reads the same everywhere.
					paymentDate: fromStudioTime(paymentDate, "12:00"),
					method,
					reference: reference || null,
					notes: `Payment recorded via ${doc.documentNumber}`,
					requestId: isFirstRow ? requestId ?? null : null,
				});

				isFirstRow = false;
			}
		});

		revalidatePath(`/b2b/documents/${id}`);
		if (partnerId || doc.partnerId) revalidatePath(`/b2b/partners/${partnerId || doc.partnerId}`);
		revalidatePath("/b2b/documents");

		return { success: true };
	} catch (error) {
		if (error instanceof OverpaymentError) {
			return {
				error: `Amount exceeds outstanding balance of ${error.outstanding.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`,
			};
		}
		// Postgres unique_violation → idempotent retry of an already-recorded payment.
		if (
			error instanceof Error &&
			"code" in error &&
			(error as { code?: string }).code === "23505" &&
			error.message.includes("request_id")
		) {
			return { success: true };
		}
		return { error: "Failed to record payment", ref: logServerError("Error recording payment", error) };
	}
}

class OverpaymentError extends Error {
	outstanding: number;
	constructor(outstanding: number) {
		super("Overpayment");
		this.outstanding = outstanding;
	}
}

export async function deleteDocumentAction(id: string, partnerId?: string): Promise<ActionState> {
	await requireUser();
	try {
		const doc = await db.query.b2bDocuments.findFirst({
			where: eq(b2bDocuments.id, id),
		});
		if (!doc) return { error: "Document not found" };
		if (doc.status !== "draft") {
			return { error: "Issued documents must be archived, not deleted" };
		}

		await db.delete(b2bDocuments).where(eq(b2bDocuments.id, id));
		if (partnerId) revalidatePath(`/b2b/partners/${partnerId}`);
		revalidatePath("/b2b/documents");
		if (doc.parentDocumentId) revalidatePath(`/b2b/documents/${doc.parentDocumentId}`);
		return { success: true };
	} catch (error) {
		return { error: "Failed to delete document", ref: logServerError("Error deleting document", error) };
	}
}

export async function updateDocumentNotesAction(id: string, notes: string): Promise<ActionState> {
	await requireUser();
	try {
		const doc = await db.query.b2bDocuments.findFirst({
			where: eq(b2bDocuments.id, id),
		});
		if (!doc) return { error: "Document not found" };
		if (doc.status !== "draft") {
			return { error: "Notes can only be edited on drafts" };
		}

		await db
			.update(b2bDocuments)
			.set({ notes, updatedAt: new Date() })
			.where(eq(b2bDocuments.id, id));

		revalidatePath(`/b2b/documents/${id}`);
		return { success: true };
	} catch (error) {
		return { error: "Failed to update notes", ref: logServerError("Error updating notes", error) };
	}
}

/**
 * A draft's lines, as she leaves them: checked here too (the page checks
 * first), each item once, in her order. An invoice from a quotation keeps
 * the quotation's tax and stays within what's left of it.
 */
export async function updateDocumentLinesAction(
	id: string,
	data: unknown,
): Promise<ActionState> {
	await requireUser();
	try {
		const parsed = documentLinesSchema.safeParse(data);
		if (!parsed.success) {
			return { error: parsed.error.issues[0]?.message ?? "Check the lines" };
		}

		const doc = await db.query.b2bDocuments.findFirst({
			where: eq(b2bDocuments.id, id),
			with: { parent: true },
		});

		if (!doc) return { error: "Document not found" };
		if (doc.archivedAt) return { error: "Archived documents cannot be edited" };
		if (doc.status !== "draft") return { error: "Only draft documents can be edited" };

		const lines = mergeSameLines(parsed.data.lines);
		const taxRate = doc.type === "invoice" && doc.parent ? doc.parent.taxRate : parsed.data.taxRate;

		await db.transaction(async (tx) => {
			if (doc.type === "invoice" && doc.parentDocumentId) {
				const quoteLines = await tx.select().from(b2bDocumentLines).where(eq(b2bDocumentLines.documentId, doc.parentDocumentId));
				const siblings = await tx.query.b2bDocuments.findMany({
					where: and(eq(b2bDocuments.parentDocumentId, doc.parentDocumentId), eq(b2bDocuments.type, "invoice")),
					with: { lines: true },
				});
				const problem = beyondTheQuote(quoteBalance(quoteLines, siblings, id), lines);
				if (problem) throw new RefusedError(problem);
			}

			const { computed, rows } = lineRows(id, lines, taxRate);
			await tx.delete(b2bDocumentLines).where(eq(b2bDocumentLines.documentId, id));
			if (rows.length > 0) {
				await tx.insert(b2bDocumentLines).values(rows);
			}

			await tx
				.update(b2bDocuments)
				.set({
					subtotal: computed.subtotal.toFixed(2),
					taxRate: computed.taxRate.toFixed(2),
					totalAmount: computed.totalAmount.toFixed(2),
					updatedAt: new Date(),
				})
				.where(eq(b2bDocuments.id, id));
		});

		revalidatePath(`/b2b/documents/${id}`);
		if (doc.parentDocumentId) revalidatePath(`/b2b/documents/${doc.parentDocumentId}`);
		return { success: true };
	} catch (error) {
		if (error instanceof RefusedError) return { error: error.message };
		return { error: "Failed to update lines", ref: logServerError("Error updating document lines", error) };
	}
}
