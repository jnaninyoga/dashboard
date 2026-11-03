import { z } from "zod";

import { numberFromInput } from "./shared";

// --- DISCOUNT SCHEMA ---
// A discount she gives a client ("Senior −12,5 %"), taken off every
// membership they buy: a share of the price, or an amount.
export const discountSchema = z
	.object({
		name: z.string().trim().min(1, "Give it a name").max(60, "Keep the name under 60 characters"),
		discountType: z.enum(["percentage", "fixed"]),
		discountValue: numberFromInput(z.number().gt(0, "More than 0, or it isn't a discount")),
	})
	.refine((v) => v.discountType !== "percentage" || v.discountValue <= 100, {
		message: "At most 100 %",
		path: ["discountValue"],
	});

/** What the form holds while typing. */
export type DiscountFormInput = z.input<typeof discountSchema>;
/** What a valid form submits. */
export type DiscountFormValues = z.output<typeof discountSchema>;
