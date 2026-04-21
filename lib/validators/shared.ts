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
