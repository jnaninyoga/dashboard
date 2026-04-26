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
export const documentSchema = z.object({
	partnerId: z.string().uuid("Please select a partner"),
	contactId: z.string().uuid().optional().nullable(),
	type: z.enum(["quote", "invoice"]),
	status: z.enum([
		"draft",
		"sent",
		"accepted",
		"partially_paid",
		"paid",
		"cancelled",
	]),
	documentNumber: z.string().min(1, "Document number is required"),
	issueDate: z.string().min(1, "Issue date is required"),
	dueDate: z.string().optional().nullable(),
	subtotal: z.string().min(1),
	taxRate: z.string().min(1),
	totalAmount: z.string().min(1, "Total amount is required"),
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

// --- PARTIAL INVOICE SCHEMA ---
export const partialInvoiceSchema = z.object({
	lines: z.array(
		z.object({
			sourceLineId: z.string(),
			description: z.string(),
			unitPrice: z.string(),
			quantity: z.string(),
			totalPrice: z.string(),
			maxQuantity: z.number(),
		}),
	),
	adjustment: z.string().default("0"),
	adjustmentLabel: z.string().default("Financial Adjustment"),
	taxRate: z.string(),
	notes: z.string().optional(),
});

export type PartialInvoiceFormValues = z.infer<typeof partialInvoiceSchema>;

// --- RECORD PAYMENT SCHEMA ---
export const recordPaymentSchema = z.object({
	amountPaid: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
		message: "Please enter a valid amount",
	}),
});

export type RecordPaymentFormValues = z.infer<typeof recordPaymentSchema>;
