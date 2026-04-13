"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/drizzle";
import { b2bDocumentLines, b2bDocuments } from "@/drizzle/schema";
import { B2BDocumentStatus, B2BDocumentType } from "@/lib/types/b2b";
import { createDocumentWithLinesSchema } from "@/lib/validators";

import { and, desc, eq, ilike, or } from "drizzle-orm";

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
		// @ts-ignore - newId is assigned in transaction
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
}) {
	const { query, type, status } = filters || {};

	try {
		const documents = await db.query.b2bDocuments.findMany({
			where: (docs) => {
				const conditions = [];

				if (query) {
					conditions.push(
						or(
							ilike(docs.documentNumber, `%${query}%`),
							ilike(docs.notes ?? "", `%${query}%`)
						)
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
		});
		return { documents };
	} catch (error) {
		console.error("Error fetching documents:", error);
		return { error: "Failed to fetch documents" };
	}
}

export async function getDocumentByIdAction(id: string) {
	try {
		const document = await db.query.b2bDocuments.findFirst({
			where: eq(b2bDocuments.id, id),
			with: {
				partner: true,
				contact: true,
				lines: {
					orderBy: [desc(b2bDocumentLines.createdAt)],
				},
				parent: true,
				children: true,
			},
		});
		return { document };
	} catch (error) {
		console.error("Error fetching document:", error);
		return { error: "Failed to fetch document" };
	}
}

export async function convertQuoteToInvoiceAction(quoteId: string): Promise<ActionState> {
	try {
		const quote = await db.query.b2bDocuments.findFirst({
			where: eq(b2bDocuments.id, quoteId),
			with: {
				lines: true,
			},
		});

		if (!quote || quote.type !== "quote") {
			return { error: "Original quote not found" };
		}

		const nextNumber = await getNextDocumentNumber("invoice");
		let newId: string;

		await db.transaction(async (tx) => {
			// 1. Create Invoice
			const [invoice] = await tx
				.insert(b2bDocuments)
				.values({
					partnerId: quote.partnerId,
					contactId: quote.contactId,
					type: "invoice",
					status: "draft",
					documentNumber: nextNumber,
					issueDate: new Date().toISOString().split("T")[0],
					dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 15 days default
					subtotal: quote.subtotal,
					taxRate: quote.taxRate,
					totalAmount: quote.totalAmount,
					notes: `Generated from ${quote.documentNumber}`,
					parentDocumentId: quoteId,
				})
				.returning();

			newId = invoice.id;

			// 2. Copy Lines
			const linesToInsert = quote.lines.map((line) => ({
				documentId: invoice.id,
				description: line.description,
				quantity: line.quantity,
				unitPrice: line.unitPrice,
				totalPrice: line.totalPrice,
			}));

			await tx.insert(b2bDocumentLines).values(linesToInsert);

			// 3. Mark Quote as Accepted if it wasn't
			if (quote.status !== "accepted") {
				await tx
					.update(b2bDocuments)
					.set({ status: "accepted", updatedAt: new Date() })
					.where(eq(b2bDocuments.id, quoteId));
			}
		});

		revalidatePath("/b2b/documents");
		revalidatePath(`/b2b/partners/${quote.partnerId}`);
		// @ts-ignore
		return { success: true, id: newId };
	} catch (error) {
		console.error("Error converting quote to invoice:", error);
		return { error: "Failed to convert quote" };
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

export async function updateDocumentLinesAction(
	id: string, 
	data: { lines: any[], subtotal: string, totalAmount: string }
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
