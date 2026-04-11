"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/drizzle";
import { b2bDocumentLines, b2bDocuments } from "@/drizzle/schema";
import { createDocumentWithLinesSchema } from "@/lib/validators";

import { eq } from "drizzle-orm";

export type ActionState = {
	error?: string;
	success?: boolean;
	issues?: Record<string, string[] | undefined>;
};

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
		return { success: true };
	} catch (error) {
		console.error("Error creating B2B document:", error);
		return { error: "Failed to create document" };
	}
}

export async function updateDocumentStatusAction(
	id: string,
	status: "draft" | "sent" | "accepted" | "paid" | "cancelled",
	partnerId: string
): Promise<ActionState> {
	try {
		await db
			.update(b2bDocuments)
			.set({ status, updatedAt: new Date() })
			.where(eq(b2bDocuments.id, id));

		revalidatePath(`/b2b/partners/${partnerId}`);
		return { success: true };
	} catch (error) {
		console.error("Error updating document status:", error);
		return { error: "Failed to update status" };
	}
}

export async function deleteDocumentAction(id: string, partnerId: string): Promise<ActionState> {
	try {
		await db.delete(b2bDocuments).where(eq(b2bDocuments.id, id));
		revalidatePath(`/b2b/partners/${partnerId}`);
		return { success: true };
	} catch (error) {
		console.error("Error deleting document:", error);
		return { error: "Failed to delete document" };
	}
}
