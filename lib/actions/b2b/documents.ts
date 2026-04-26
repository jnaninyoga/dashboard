"use server";

import { revalidatePath } from "next/cache";

import { B2BDocumentLine, B2BDocumentStatus, B2BDocumentType, type DocumentWithRelations } from "@/lib/types/b2b";
import { createDocumentWithLinesSchema, DocumentLineFormValues } from "@/lib/validators";
import { db } from "@/services/database";
import { b2bDocumentLines, b2bDocuments, b2bPayments } from "@/services/database/schema";

import { and, asc, desc, eq, ilike, inArray, not, or } from "drizzle-orm";

export type ActionState = {
	error?: string;
	success?: boolean;
	issues?: Record<string, string[] | undefined>;
	id?: string;
};

/**
 * ERP-style incremental document numbering
 */
export async function getNextDocumentNumber(type: B2BDocumentType): Promise<string> {
	const prefix = type === "quote" ? "QUO" : "INV";
	const year = new Date().getFullYear();
	
	const lastDoc = await db.query.b2bDocuments.findFirst({
		where: and(
			eq(b2bDocuments.type, type),
			ilike(b2bDocuments.documentNumber, `${prefix}-${year}-%`)
		),
		orderBy: [desc(b2bDocuments.documentNumber)],
	});

	let nextNumber = 1;
	if (lastDoc) {
		const parts = lastDoc.documentNumber.split("-");
		const lastSeq = parseInt(parts[parts.length - 1]);
		if (!isNaN(lastSeq)) {
			nextNumber = lastSeq + 1;
		}
	}

	return `${prefix}-${year}-${nextNumber.toString().padStart(4, "0")}`;
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
			// 1. Insert Document
			const [newDoc] = await tx
				.insert(b2bDocuments)
				.values({
					...document,
					subtotal: document.subtotal.toString(),
					taxRate: document.taxRate.toString(),
					totalAmount: document.totalAmount.toString(),
				})
				.returning();

			newId = newDoc.id;

			// 2. Insert Lines
			const linesToInsert = lines.map((line) => ({
				...line,
				documentId: newDoc.id,
				quantity: line.quantity.toString(),
				unitPrice: line.unitPrice.toString(),
				totalPrice: line.totalPrice.toString(),
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

export async function getDocumentsAction(filters?: {
	query?: string;
	type?: B2BDocumentType | "all";
	status?: B2BDocumentStatus | "all";
}): Promise<{ documents?: DocumentWithRelations[]; error?: string }> {
	const { query, type, status } = filters || {};

	try {
		const documents = (await db.query.b2bDocuments.findMany({
			where: (docs) => {
				const conditions = [];

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
				where: and(
					eq(b2bDocuments.partnerId, document.partnerId),
					eq(b2bDocuments.type, "invoice"),
					eq(b2bDocuments.parentDocumentId, document.parentDocumentId),
					not(eq(b2bDocuments.status, "cancelled")),
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
				totalPrice: (remaining * Number(line.unitPrice)).toString(),
			};
		}).filter(l => l.quantity > 0);

		// 2. No more carry-over line in line_items (moved to Account Statement UI)

		if (initialLines.length === 0) {
			return { error: "Quote is already fully invoiced" };
		}

		const nextNumber = await getNextDocumentNumber("invoice");
		let newId: string;

		await db.transaction(async (tx) => {
			const subtotal = initialLines.reduce((acc, l) => acc + Number(l.totalPrice), 0);
			const taxRate = Number(quote.taxRate);
			const totalAmount = subtotal * (1 + taxRate / 100);

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
					subtotal: subtotal.toString(),
					taxRate: quote.taxRate,
					totalAmount: totalAmount.toFixed(2),
					notes: `Invoice for work completed from ${quote.documentNumber}`,
					parentDocumentId: quoteId,
				})
				.returning();

			newId = invoice.id;

			// 2. Insert Lines
			const linesToInsert = initialLines.map((line) => ({
				documentId: invoice.id,
				sourceLineId: line.sourceLineId,
				description: line.description,
				quantity: line.quantity.toString(),
				unitPrice: line.unitPrice,
				totalPrice: line.totalPrice,
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
		subtotal: string;
		taxRate: string;
		totalAmount: string;
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

		const nextNumber = await getNextDocumentNumber("invoice");
		let newId: string;

		await db.transaction(async (tx) => {
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
					subtotal: data.subtotal,
					taxRate: data.taxRate,
					totalAmount: data.totalAmount,
					notes: data.notes || `Partial invoice from ${quote.documentNumber}`,
					parentDocumentId: quoteId,
				})
				.returning();

			newId = invoice.id;

			const linesToInsert = data.lines.map((line) => ({
				documentId: invoice.id,
				description: line.description,
				quantity: line.quantity,
				unitPrice: line.unitPrice,
				totalPrice: line.totalPrice,
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
	partnerId?: string
): Promise<ActionState> {
	try {
		const doc = await db.query.b2bDocuments.findFirst({
			where: eq(b2bDocuments.id, id),
		});

		if (!doc) return { error: "Document not found" };

		// FIFO Payment Logic
		await db.transaction(async (tx) => {
			// 1. Fetch all unpaid/partially paid invoices for this partner, sorted by oldest first
			const unpaidInvoices = await tx.query.b2bDocuments.findMany({
				where: and(
					eq(b2bDocuments.partnerId, partnerId || doc.partnerId),
					eq(b2bDocuments.type, "invoice"),
					inArray(b2bDocuments.status, ["sent", "partially_paid"]),
					doc.parentDocumentId 
						? eq(b2bDocuments.parentDocumentId, doc.parentDocumentId)
						: eq(b2bDocuments.id, doc.id)
				),
				with: {
					payments: true,
				},
				orderBy: asc(b2bDocuments.createdAt),
			});

			let remainingPayment = Number(amountPaid);

			for (const invoice of unpaidInvoices) {
				if (remainingPayment <= 0) break;

				const invoiceTotal = Number(invoice.totalAmount);
				const currentPaid = (invoice.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
				const invoiceBalance = Math.max(0, invoiceTotal - currentPaid);

				const paymentToApply = Math.min(remainingPayment, invoiceBalance);
				const updatedPaid = currentPaid + paymentToApply;
				
				let newStatus: B2BDocumentStatus = updatedPaid >= (invoiceTotal - 0.01) ? "paid" : "partially_paid";

				await tx.update(b2bDocuments)
					.set({
						status: newStatus,
						updatedAt: new Date()
					})
					.where(eq(b2bDocuments.id, invoice.id));

				// Record the individual transaction for accurate history
				await tx.insert(b2bPayments).values({
					documentId: invoice.id,
					amount: paymentToApply.toString(),
					paymentDate: new Date(),
					notes: `Payment recorded via ${doc.documentNumber}`
				});

				remainingPayment -= paymentToApply;
			}
		});

		revalidatePath(`/b2b/documents/${id}`);
		if (partnerId || doc.partnerId) revalidatePath(`/b2b/partners/${partnerId || doc.partnerId}`);
		revalidatePath("/b2b/documents");
		
		return { success: true };
	} catch (error) {
		console.error("Error recording payment:", error);
		return { error: "Failed to record payment" };
	}
}

export async function deleteDocumentAction(id: string, partnerId?: string): Promise<ActionState> {
	try {
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
			},
		})) as DocumentWithRelations | null;

		if (!invoice || invoice.type !== "invoice") {
			return { error: "Invoice not found" };
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
	data: { lines: DocumentLineFormValues[], subtotal: string, taxRate: string, totalAmount: string }
): Promise<ActionState> {
	try {
		const doc = await db.query.b2bDocuments.findFirst({
			where: eq(b2bDocuments.id, id),
		});

		if (!doc) return { error: "Document not found" };
		if (doc.status !== "draft") return { error: "Only draft documents can be edited" };

		await db.transaction(async (tx) => {
			// 1. Delete old lines
			await tx.delete(b2bDocumentLines).where(eq(b2bDocumentLines.documentId, id));

			// 2. Insert new lines
			const linesToInsert = data.lines.map((line) => ({
				documentId: id,
				sourceLineId: line.sourceLineId,
				description: line.description,
				quantity: line.quantity.toString(),
				unitPrice: line.unitPrice.toString(),
				totalPrice: line.totalPrice.toString(),
			}));

			if (linesToInsert.length > 0) {
				await tx.insert(b2bDocumentLines).values(linesToInsert);
			}

			// 3. Update document totals
			await tx
				.update(b2bDocuments)
				.set({
					subtotal: data.subtotal,
					taxRate: data.taxRate,
					totalAmount: data.totalAmount,
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
