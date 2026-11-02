import { parseAmountInput } from "@/lib/utils/currency";

import { z } from "zod";

import { PAYMENT_METHODS } from "./document";

// --- SELLING A MEMBERSHIP TO A CLIENT ---
// From her price list, the discount she gives (the client's by default),
// the price she settles on (editable), and how she was paid.
export const sellMembershipSchema = z.object({
	membershipId: z.string().uuid("Choose a membership"),
	// None: no discount on this sale.
	discountId: z.string().uuid().nullable(),
	price: z.string().refine((value) => parseAmountInput(value) >= 0, "Enter the price (0 or more)"),
	soldOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the day"),
	paymentMethod: z.enum(PAYMENT_METHODS, { error: "Choose how it was paid" }),
	paymentReference: z.string().trim().max(80, "Keep it under 80 characters").optional(),
	// The number on the physical card she hands over, if any.
	physicalCardRef: z.string().trim().max(40, "Keep it under 40 characters").optional(),
});

export type SellMembershipValues = z.infer<typeof sellMembershipSchema>;

// Undoing a sale: why (it decides the words on record), and a note.
export const CANCEL_SALE_REASONS = ["mistake", "refunded"] as const;
export type CancelSaleReason = (typeof CANCEL_SALE_REASONS)[number];

export const cancelSaleSchema = z.object({
	reason: z.enum(CANCEL_SALE_REASONS, { error: "Say why" }),
	note: z.string().trim().max(200, "Keep it under 200 characters").optional(),
});
