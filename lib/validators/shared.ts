import { parseAmountInput } from "@/lib/utils/currency";

import { z } from "zod";

/**
 * String-based numeric validators for form fields.
 * HTML inputs produce strings — we validate them as strings here,
 * and convert to numbers in the server action at save time.
 */
export const numericStr = (min = 0, msg?: string) =>
	z
		.string()
		.min(1, msg || "Required")
		.refine((v) => !isNaN(Number(v)) && Number(v) >= min, {
			message: msg || `Must be ≥ ${min}`,
		});

/**
 * A number typed into a text field. The field keeps the raw text while the
 * operator types ("12." on the way to "12.5", or French "12,5"); validation
 * turns it into a number, so the submitted value is always numeric.
 */
export const numberFromInput = (schema: z.ZodNumber = z.number()) =>
	z
		.union([z.number(), z.string()])
		.transform((value, ctx) => {
			const n = typeof value === "number" ? value : parseAmountInput(value);
			if (!Number.isFinite(n)) {
				ctx.addIssue({ code: "custom", message: "Enter a number" });
				return z.NEVER;
			}
			return n;
		})
		.pipe(schema);
