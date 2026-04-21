import { z } from "zod";

// --- MEMBERSHIP PRODUCT SCHEMA ---
export const membershipProductSchema = z.object({
	name: z.string().min(1, "Name is required"),
	basePrice: z.number().min(0, "Price must be positive"),
	durationMonths: z.number().int().min(1, "Duration must be at least 1 month"),
	defaultCredits: z.number().int().min(1, "Credits must be at least 1"),
});

export type MembershipProductFormValues = z.infer<
	typeof membershipProductSchema
>;
