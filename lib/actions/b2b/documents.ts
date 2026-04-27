"use server";

import { revalidatePath } from "next/cache";

import { B2BDocumentStatus, B2BDocumentType, type DocumentWithRelations } from "@/lib/types/b2b";
import { createDocumentWithLinesSchema, DocumentLineFormValues } from "@/lib/validators";
import { db } from "@/services/database";
import {
	b2bDocumentLines,
	b2bDocuments,
	b2bDocumentSequences,
	b2bPayments,
} from "@/services/database/schema";

import { and, asc, desc, eq, ilike, inArray, not, or, sql } from "drizzle-orm";

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

// Allowed status transitions. Anything outside this map is rejected — once an
// invoice is `sent`, payments drive it forward; corrections go through archive.
const ALLOWED_STATUS_TRANSITIONS: Record<B2BDocumentStatus, B2BDocumentStatus[]> = {
	draft: ["sent"],
	sent: ["accepted", "partially_paid", "paid"],
	accepted: [],
	partially_paid: ["paid"],
	paid: [],
	cancelled: [],
};

export type ActionState = {
	error?: string;
	success?: boolean;
	issues?: Record<string, string[] | undefined>;
	id?: string;
};

/**
 * Reserve the next document number for (type, year) using b2b_document_sequences
 * with row-level locking (SELECT … FOR UPDATE) inside the caller's transaction.
 * Two concurrent invoice creations cannot collide.
 */
async function reserveNextDocumentNumber(
	tx: DbTx,
	type: B2BDocumentType,
): Promise<string> {
	const prefix = type === "quote" ? "QUO" : "INV";
	const year = new Date().getFullYear();

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
 * Read-only preview of the next number for (type, year). Does NOT consume the
 * sequence — safe to call on every render of the create page so refreshes
 * don't leave gaps. The actual value is claimed inside createDocumentAction's
 * transaction via reserveNextDocumentNumber; if another insert lands in the
 * meantime the saved number may be one higher than the preview, which is fine.
 */
export async function peekNextDocumentNumber(
	type: B2BDocumentType,
): Promise<string> {
	const prefix = type === "quote" ? "QUO" : "INV";
	const year = new Date().getFullYear();

	const row = await db.query.b2bDocumentSequences.findFirst({
		where: and(
			eq(b2bDocumentSequences.type, type),
			eq(b2bDocumentSequences.year, year),
		),
	});

	const next = row?.nextValue ?? 1;
	return `${prefix}-${year}-${next.toString().padStart(4, "0")}`;
}

export async function createDocumentAction(
	_prevState: ActionState | null,
	data: unknown
): Promise<ActionState> {
	const validated = createDocumentWithLinesSchema.safeParse(data);

	if (!validated.success) {
		return {
			error: "Validation failed",
			issues: validated.error.flatten().fieldErrors,
		};
	}

	const { document, lines } = validated.data;

	try {
		let newId: string;
		await db.transaction(async (tx) => {
			// Reserve the official sequence number inside the same transaction so
			// the row lock guarantees no two concurrent inserts can clash.
			const documentNumber = await reserveNextDocumentNumber(tx, document.type);

			// Recompute totals server-side. Client-supplied subtotal / totalAmount
			// are ignored to prevent tampering or drift on a posted document.
			const computed = computeTotals(lines, document.taxRate);

			// 1. Insert Document
			const [newDoc] = await tx
				.insert(b2bDocuments)
				.values({
					...document,
					documentNumber,
					subtotal: computed.subtotal.toFixed(2),
					taxRate: computed.taxRate.toFixed(2),
					totalAmount: computed.totalAmount.toFixed(2),
				})
				.returning();

			newId = newDoc.id;

			// 2. Insert Lines (with recomputed totalPrice)
			const linesToInsert = lines.map((line, i) => ({
				...line,
				documentId: newDoc.id,
				quantity: computed.lines[i].quantity.toString(),
				unitPrice: computed.lines[i].unitPrice.toFixed(2),
				totalPrice: computed.lines[i].totalPrice.toFixed(2),
			}));

			await tx.insert(b2bDocumentLines).values(linesToInsert);
		});

		revalidatePath(`/b2b/partners/${document.partnerId}`);
		revalidatePath("/b2b/documents");
		// @ts-expect-error - newId is assigned in transaction
		return { success: true, id: newId };
	} catch (error) {
		console.error("Error creating B2B document:", error);
		return { error: "Failed to create document" };
	}
}

export async function updateDocumentStatusAction(
	id: string,
	status: B2BDocumentStatus,
	partnerId?: string
): Promise<ActionState> {
	try {
		const doc = await db.query.b2bDocuments.findFirst({
			where: eq(b2bDocuments.id, id),
			with: { partner: true },
		});
		if (!doc) return { error: "Document not found" };
		if (doc.archivedAt) return { error: "Archived documents cannot change status" };

		const allowed = ALLOWED_STATUS_TRANSITIONS[doc.status] ?? [];
		if (!allowed.includes(status)) {
			return {
				error: `Cannot transition ${doc.status} → ${status}. Allowed: ${allowed.join(", ") || "(terminal)"}`,
			};
		}

		// Issuing an invoice requires a valid partner ICE (15 digits) — without
		// it the partner cannot reclaim VAT and the invoice fails Morocco audit.
		if (status === "sent" && doc.type === "invoice" && !isValidIce(doc.partner?.taxId)) {
			return {
				error:
					"Add the partner's ICE (Tax ID) before issuing this invoice.",
			};
		}

		await db
			.update(b2bDocuments)
			.set({ status, updatedAt: new Date() })
			.where(eq(b2bDocuments.id, id));

		if (partnerId) revalidatePath(`/b2b/partners/${partnerId}`);
		revalidatePath("/b2b/documents");
		revalidatePath(`/b2b/documents/${id}`);

		return { success: true };
	} catch (error) {
		console.error("Error updating document status:", error);
		return { error: "Failed to update status" };
	}
}

/**
 * Archive an issued document (soft-hide). The row, its number, and its history
 * are preserved — required for an audit-grade trail. Drafts use deleteDocumentAction.
 */
export async function archiveDocumentAction(
	id: string,
	reason?: string,
	partnerId?: string,
): Promise<ActionState> {
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

		return { success: true };
	} catch (error) {
		console.error("Error archiving document:", error);
		return { error: "Failed to archive document" };
	}
}

export async function unarchiveDocumentAction(
	id: string,
	partnerId?: string,
): Promise<ActionState> {
	try {
		const doc = await db.query.b2bDocuments.findFirst({
			where: eq(b2bDocuments.id, id),
		});
		if (!doc) return { error: "Document not found" };
		if (!doc.archivedAt) return { error: "Document is not archived" };

		await db
			.update(b2bDocuments)
			.set({ archivedAt: null, archivedReason: null, updatedAt: new Date() })
			.where(eq(b2bDocuments.id, id));

		if (partnerId) revalidatePath(`/b2b/partners/${partnerId}`);
		revalidatePath("/b2b/documents");
		revalidatePath(`/b2b/documents/${id}`);

		return { success: true };
	} catch (error) {
		console.error("Error restoring document:", error);
		return { error: "Failed to restore document" };
	}
}

export async function getDocumentsAction(filters?: {
	query?: string;
	type?: B2BDocumentType | "all";
	status?: B2BDocumentStatus | "all";
	includeArchived?: boolean;
}): Promise<{ documents?: DocumentWithRelations[]; error?: string }> {
	const { query, type, status, includeArchived } = filters || {};

	try {
		const documents = (await db.query.b2bDocuments.findMany({
			where: (docs, { isNull }) => {
				const conditions = [];

				if (!includeArchived) {
					conditions.push(isNull(docs.archivedAt));
				}

				if (query) {
					conditions.push(
						or(
							ilike(docs.documentNumber, `%${query}%`),
							ilike(docs.notes ?? "", `%${query}%`),
						),
					);
				}

				if (type && type !== "all") {
					conditions.push(eq(docs.type, type));
				}

				if (status && status !== "all") {
					conditions.push(eq(docs.status, status));
				}

				return conditions.length > 0 ? and(...conditions) : undefined;
			},
			with: {
				partner: true,
				contact: true,
			},
			orderBy: [desc(b2bDocuments.issueDate), desc(b2bDocuments.createdAt)],
		})) as DocumentWithRelations[];

		return { documents };

	} catch (error) {
		console.error("Error fetching documents:", error);
		return { error: "Failed to fetch documents" };
	}
}

export async function getDocumentByIdAction(id: string): Promise<{ document?: DocumentWithRelations; accountSummary?: { previousInvoices: any[], allRelatedInvoices?: any[] }; error?: string }> {
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
				lines: {
					orderBy: [desc(b2bDocumentLines.createdAt)],
				},
				parent: {
					with: {
						lines: true,
					},
				},
				children: true,
				payments: {
					orderBy: [desc(b2bPayments.paymentDate)],
				},
			},
		})) as DocumentWithRelations | null;

		if (!document) return { error: "Document not found" };

		// Fetch related invoices for fulfillment tracking and account summary
		let previousInvoices: any[] = [];
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
				inArray(inv.status, ["sent", "partially_paid"]) &&
				new Date(inv.createdAt).getTime() < new Date(document.createdAt).getTime()
			).map(inv => ({ ...inv, isSibling: true }));

			return { 
				document, 
				accountSummary: {
					previousInvoices: statementInvoices,
					allRelatedInvoices: previousInvoices // For fulfillment logic in ActionRibbon
				} 
			};
		}

		return { 
			document, 
			accountSummary: {
				previousInvoices: []
			} 
		};

	} catch (error) {
		console.error("Error fetching document:", error);
		return { error: "Failed to fetch document" };
	}
}

export async function convertQuoteToInvoiceAction(quoteId: string): Promise<ActionState> {
	try {
		const quote = (await db.query.b2bDocuments.findFirst({
			where: eq(b2bDocuments.id, quoteId),
			with: {
				lines: true,
				children: {
					with: {
						lines: true,
					},
				},
			},
		})) as DocumentWithRelations | null;

		if (!quote || quote.type !== "quote") {
			return { error: "Original quote not found" };
		}

		// 1. Calculate remaining quantities for each line
		const initialLines = (quote.lines || []).map((line) => {
			const alreadyInvoiced = (quote.children || []).reduce((acc: number, child: DocumentWithRelations) => {
				const matchingLine = child.lines?.find((l) => l.sourceLineId === line.id);
				return acc + (Number(matchingLine?.quantity) || 0);
			}, 0);

			const remaining = Math.max(0, Number(line.quantity) - alreadyInvoiced);

			return {
				sourceLineId: line.id,
				description: line.description,
				unitPrice: line.unitPrice,
				quantity: remaining,
			};
		}).filter(l => l.quantity > 0);

		if (initialLines.length === 0) {
			return { error: "Quote is already fully invoiced" };
		}

		// Tax inherited from parent quote per the solo-operator rule.
		const computed = computeTotals(initialLines, quote.taxRate);

		let newId: string;

		await db.transaction(async (tx) => {
			const nextNumber = await reserveNextDocumentNumber(tx, "invoice");

			// 1. Create Draft Invoice
			const [invoice] = await tx
				.insert(b2bDocuments)
				.values({
					partnerId: quote.partnerId,
					contactId: quote.contactId,
					type: "invoice",
					status: "draft",
					documentNumber: nextNumber,
					issueDate: new Date().toISOString().split("T")[0],
					dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
					subtotal: computed.subtotal.toFixed(2),
					taxRate: computed.taxRate.toFixed(2),
					totalAmount: computed.totalAmount.toFixed(2),
					notes: `Invoice for work completed from ${quote.documentNumber}`,
					parentDocumentId: quoteId,
				})
				.returning();

			newId = invoice.id;

			// 2. Insert Lines
			const linesToInsert = initialLines.map((line, i) => ({
				documentId: invoice.id,
				sourceLineId: line.sourceLineId,
				description: line.description,
				quantity: computed.lines[i].quantity.toString(),
				unitPrice: computed.lines[i].unitPrice.toFixed(2),
				totalPrice: computed.lines[i].totalPrice.toFixed(2),
			}));

			await tx.insert(b2bDocumentLines).values(linesToInsert);
			
			// 3. Ensure Quote is marked as accepted
			if (quote.status !== "accepted") {
				await tx.update(b2bDocuments)
					.set({ status: "accepted", updatedAt: new Date() })
					.where(eq(b2bDocuments.id, quoteId));
			}
		});

		revalidatePath(`/b2b/partners/${quote.partnerId}`);
		revalidatePath("/b2b/documents");
		// @ts-expect-error - newId is assigned in transaction
		return { success: true, id: newId };
	} catch (error) {
		console.error("Error converting quote to invoice:", error);
		return { error: "Failed to create draft invoice" };
	}
}

export async function createPartialInvoiceAction(
	quoteId: string,
	data: {
		lines: { sourceLineId?: string; description: string; quantity: string; unitPrice: string; totalPrice: string }[];
		taxRate: string;
		notes?: string;
	}
): Promise<ActionState> {
	try {
		const quote = await db.query.b2bDocuments.findFirst({
			where: eq(b2bDocuments.id, quoteId),
		});

		if (!quote || quote.type !== "quote") {
			return { error: "Source quotation not found" };
		}

		// Inherit tax rate from the parent quote — solo-operator simplicity rule.
		// The user sets tax once on the quote; everything downstream follows it.
		const computed = computeTotals(data.lines, quote.taxRate);

		let newId: string;

		await db.transaction(async (tx) => {
			const nextNumber = await reserveNextDocumentNumber(tx, "invoice");
			const [invoice] = await tx
				.insert(b2bDocuments)
				.values({
					partnerId: quote.partnerId,
					contactId: quote.contactId,
					type: "invoice",
					status: "sent",
					documentNumber: nextNumber,
					issueDate: new Date().toISOString().split("T")[0],
					dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
					subtotal: computed.subtotal.toFixed(2),
					taxRate: computed.taxRate.toFixed(2),
					totalAmount: computed.totalAmount.toFixed(2),
					notes: data.notes || `Partial invoice from ${quote.documentNumber}`,
					parentDocumentId: quoteId,
				})
				.returning();

			newId = invoice.id;

			const linesToInsert = data.lines.map((line, i) => ({
				documentId: invoice.id,
				description: line.description,
				quantity: computed.lines[i].quantity.toString(),
				unitPrice: computed.lines[i].unitPrice.toFixed(2),
				totalPrice: computed.lines[i].totalPrice.toFixed(2),
				sourceLineId: line.sourceLineId,
			}));

			await tx.insert(b2bDocumentLines).values(linesToInsert);

			if (quote.status !== "accepted") {
				await tx
					.update(b2bDocuments)
					.set({ status: "accepted", updatedAt: new Date() })
					.where(eq(b2bDocuments.id, quoteId));
			}
		});

		revalidatePath("/b2b/documents");
		revalidatePath(`/b2b/partners/${quote.partnerId}`);
		revalidatePath(`/b2b/documents/${quoteId}`);
		// @ts-expect-error - newId is assigned in transaction
		return { success: true, id: newId };
	} catch (error) {
		console.error("Error creating partial invoice:", error);
		return { error: "Failed to create partial invoice" };
	}
}

export async function recordDocumentPaymentAction(
	id: string,
	amountPaid: string,
	partnerId?: string,
	requestId?: string,
): Promise<ActionState> {
	try {
		const doc = await db.query.b2bDocuments.findFirst({
			where: eq(b2bDocuments.id, id),
		});

		if (!doc) return { error: "Document not found" };

		const amount = Number(amountPaid);
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

		// FIFO Payment Logic
		await db.transaction(async (tx) => {
			// Fetch unpaid / partially-paid invoices in legal sequence (document
			// number, ascending). createdAt drifts under backdating; the audit
			// trail is the document number. Archived rows are excluded — they no
			// longer count toward the partner's outstanding balance.
			const unpaidInvoices = await tx.query.b2bDocuments.findMany({
				where: (docs, { isNull }) => and(
					eq(docs.partnerId, partnerId || doc.partnerId),
					eq(docs.type, "invoice"),
					inArray(docs.status, ["sent", "partially_paid"]),
					doc.parentDocumentId
						? eq(docs.parentDocumentId, doc.parentDocumentId)
						: eq(docs.id, doc.id),
					isNull(docs.archivedAt),
				),
				with: {
					payments: true,
				},
				orderBy: asc(b2bDocuments.documentNumber),
			});

			// Reject overpayment: the operator must record exactly what was
			// received, never more. Solo-operator rule: no partner credits, no
			// silent prepayments — keep the model simple.
			const totalOutstanding = unpaidInvoices.reduce((acc, inv) => {
				const total = Number(inv.totalAmount);
				const paid = (inv.payments || []).reduce(
					(s, p) => s + Number(p.amount),
					0,
				);
				return acc + Math.max(0, total - paid);
			}, 0);

			if (amount > round2(totalOutstanding) + 0.01) {
				throw new OverpaymentError(round2(totalOutstanding));
			}

			let remainingPayment = amount;
			let isFirstRow = true;

			for (const invoice of unpaidInvoices) {
				if (remainingPayment <= 0) break;

				const invoiceTotal = Number(invoice.totalAmount);
				const currentPaid = (invoice.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
				const invoiceBalance = Math.max(0, invoiceTotal - currentPaid);

				const paymentToApply = round2(Math.min(remainingPayment, invoiceBalance));
				if (paymentToApply <= 0) continue;

				const updatedPaid = currentPaid + paymentToApply;
				const newStatus: B2BDocumentStatus =
					updatedPaid >= invoiceTotal - 0.01 ? "paid" : "partially_paid";

				await tx
					.update(b2bDocuments)
					.set({ status: newStatus, updatedAt: new Date() })
					.where(eq(b2bDocuments.id, invoice.id));

				// Tag the first allocation row with the requestId so the UNIQUE
				// index dedupes concurrent retries of the same submit.
				await tx.insert(b2bPayments).values({
					documentId: invoice.id,
					amount: paymentToApply.toFixed(2),
					paymentDate: new Date(),
					notes: `Payment recorded via ${doc.documentNumber}`,
					requestId: isFirstRow ? requestId ?? null : null,
				});

				remainingPayment = round2(remainingPayment - paymentToApply);
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
		console.error("Error recording payment:", error);
		return { error: "Failed to record payment" };
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
		return { success: true };
	} catch (error) {
		console.error("Error deleting document:", error);
		return { error: "Failed to delete document" };
	}
}

export async function updateDocumentNotesAction(id: string, notes: string): Promise<ActionState> {
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
		console.error("Error updating notes:", error);
		return { error: "Failed to update notes" };
	}
}

/**
 * Confirms a draft invoice and optionally creates a backorder for remaining quantities
 */
export async function confirmInvoiceWithBackorderAction(
	invoiceId: string,
	createBackorder: boolean
): Promise<ActionState> {
	try {
		const invoice = (await db.query.b2bDocuments.findFirst({
			where: eq(b2bDocuments.id, invoiceId),
			with: {
				parent: true,
				partner: true,
			},
		})) as DocumentWithRelations | null;

		if (!invoice || invoice.type !== "invoice") {
			return { error: "Invoice not found" };
		}
		if (invoice.archivedAt) {
			return { error: "Archived documents cannot change status" };
		}
		if (invoice.status !== "draft") {
			return { error: "Only drafts can be confirmed" };
		}
		if (!isValidIce(invoice.partner?.taxId)) {
			return {
				error:
					"Add the partner's ICE (Tax ID) before issuing this invoice.",
			};
		}

		// 1. Mark current invoice as sent and clean up zero-quantity lines
		await db.transaction(async (tx) => {
			await tx.update(b2bDocuments)
				.set({ status: "sent", updatedAt: new Date() })
				.where(eq(b2bDocuments.id, invoiceId));

			// Remove any lines that have 0 quantity (they don't belong on a professional invoice)
			await tx.delete(b2bDocumentLines)
				.where(and(
					eq(b2bDocumentLines.documentId, invoiceId),
					eq(b2bDocumentLines.quantity, "0")
				));
		});

		// 2. If backorder requested and parent quote exists, create next draft
		if (createBackorder && invoice.parentDocumentId) {
			const res = await convertQuoteToInvoiceAction(invoice.parentDocumentId);
			if (res.error) {
				// If error is just "Quote is already fully invoiced", we ignore it
				if (res.error !== "Quote is already fully invoiced") {
					return res;
				}
			}
		}

		revalidatePath(`/b2b/documents/${invoiceId}`);
		revalidatePath("/b2b/documents");
		
		return { success: true };
	} catch (error) {
		console.error("Error confirming invoice:", error);
		return { error: "Failed to confirm invoice" };
	}
}

export async function updateDocumentLinesAction(
	id: string,
	data: { lines: DocumentLineFormValues[]; taxRate: string }
): Promise<ActionState> {
	try {
		const doc = await db.query.b2bDocuments.findFirst({
			where: eq(b2bDocuments.id, id),
		});

		if (!doc) return { error: "Document not found" };
		if (doc.archivedAt) return { error: "Archived documents cannot be edited" };
		if (doc.status !== "draft") return { error: "Only draft documents can be edited" };

		const computed = computeTotals(data.lines, data.taxRate);

		await db.transaction(async (tx) => {
			// 1. Delete old lines
			await tx.delete(b2bDocumentLines).where(eq(b2bDocumentLines.documentId, id));

			// 2. Insert new lines (server-recomputed totals)
			const linesToInsert = data.lines.map((line, i) => ({
				documentId: id,
				sourceLineId: line.sourceLineId,
				description: line.description,
				quantity: computed.lines[i].quantity.toString(),
				unitPrice: computed.lines[i].unitPrice.toFixed(2),
				totalPrice: computed.lines[i].totalPrice.toFixed(2),
			}));

			if (linesToInsert.length > 0) {
				await tx.insert(b2bDocumentLines).values(linesToInsert);
			}

			// 3. Update document totals
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
		return { success: true };
	} catch (error) {
		console.error("Error updating document lines:", error);
		return { error: "Failed to update lines" };
	}
}
