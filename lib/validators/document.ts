import { parseAmountInput } from "@/lib/utils/currency";

import { z } from "zod";

import { numericStr } from "./shared";

// --- DOCUMENT LINE SCHEMA ---
export const documentLineSchema = z.object({
	sourceLineId: z.string().uuid().optional().nullable(),
	description: z.string().min(1, "Description is required"),
	quantity: numericStr(0.01, "Min 0.01"),
	unitPrice: numericStr(0, "Min 0"),
	totalPrice: numericStr(0),
});

export type DocumentLineFormValues = z.infer<typeof documentLineSchema>;

// --- B2B DOCUMENT SCHEMA ---
// Numbering, subtotal, and totalAmount are owned server-side: the next
// document_number is reserved at insert time; subtotal / totalAmount are
// recomputed from the lines + taxRate. They're optional here so the form
// can leave them empty.
export const documentSchema = z.object({
	partnerId: z.string().uuid("Please select a partner"),
	contactId: z.string().uuid().optional().nullable(),
	type: z.enum(["quote", "invoice"]).default("quote"),
	status: z.enum([
		"draft",
		"sent",
		"accepted",
		"unpaid",
		"partially_paid",
		"paid",
		"cancelled",
	]),
	documentNumber: z.string().optional(),
	issueDate: z.string().min(1, "Issue date is required"),
	dueDate: z.string().optional().nullable(),
	subtotal: z.string().optional(),
	taxRate: z.string().min(1),
	totalAmount: z.string().optional(),
	notes: z.string().optional().nullable(),
	parentDocumentId: z.string().uuid().optional().nullable(),
});

export type DocumentFormValues = z.infer<typeof documentSchema>;

// --- COMPOSITE DOCUMENT + LINES SCHEMA ---
export const createDocumentWithLinesSchema = z.object({
	document: documentSchema,
	lines: z
		.array(documentLineSchema)
		.min(1, "At least one line item is required"),
});

/**
 * The lines worth keeping: a row left completely empty (no description and
 * no price) is the line waiting at the end of the table, or one she didn't
 * use, not a line to complain about.
 */
export function withoutBlankLines<T extends { description: string; unitPrice: string }>(lines: T[]): T[] {
	return lines.filter((line) => line.description.trim() || Number(line.unitPrice) > 0);
}

// --- RECORD PAYMENT SCHEMA ---
export const recordPaymentSchema = z.object({
	amountPaid: z.string().refine((val) => parseAmountInput(val) > 0, {
		message: "Enter a positive amount",
	}),
});

export type RecordPaymentFormValues = z.infer<typeof recordPaymentSchema>;
