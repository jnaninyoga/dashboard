import { z } from "zod";

import { numberFromInput } from "./shared";

// --- CATEGORY SCHEMA ---
export const categorySchema = z.object({
	name: z.string().min(1, "Name is required"),
	discountType: z.enum(["percentage", "fixed"]),
	discountValue: numberFromInput(z.number().min(0, "Value must be positive")),
});

/** What the form holds while typing. */
export type CategoryFormInput = z.input<typeof categorySchema>;
/** What a valid form submits. */
export type CategoryFormValues = z.output<typeof categorySchema>;
