import { z } from "zod";

// --- CATEGORY SCHEMA ---
export const categorySchema = z.object({
	name: z.string().min(1, "Name is required"),
	discountType: z.enum(["percentage", "fixed"]),
	discountValue: z.number().min(0, "Value must be positive"),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
