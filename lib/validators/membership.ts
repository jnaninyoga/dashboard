import { z } from "zod";

import { numberFromInput } from "./shared";

// --- MEMBERSHIP PRODUCT SCHEMA ---
export const membershipProductSchema = z.object({
	name: z.string().min(1, "Name is required"),
	basePrice: numberFromInput(z.number().min(0, "Price must be positive")),
	durationMonths: z.number().int().min(1, "Duration must be at least 1 month"),
	defaultCredits: z.number().int().min(1, "Credits must be at least 1"),
});

/** What the form holds while typing. */
export type MembershipProductFormInput = z.input<typeof membershipProductSchema>;
/** What a valid form submits. */
export type MembershipProductFormValues = z.output<typeof membershipProductSchema>;
