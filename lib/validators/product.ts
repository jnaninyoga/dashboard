import { z } from "zod";

import { numberFromInput } from "./shared";

// --- PRICE LIST: one catalog, two kinds ---

const name = z.string().trim().min(1, "Give it a name").max(80, "Keep the name under 80 characters");
const price = numberFromInput(z.number().min(0, "A price can't be negative"));

/** A whole number typed into a field that may stay empty (null). */
const optionalCount = (message: string) =>
	z
		.union([z.number(), z.string(), z.null()])
		.transform((value, ctx) => {
			if (value === null || (typeof value === "string" && !value.trim())) return null;
			const n = Number(value);
			if (!Number.isInteger(n)) {
				ctx.addIssue({ code: "custom", message: "Enter a whole number" });
				return z.NEVER;
			}
			return n;
		})
		.pipe(z.number().min(1, message).nullable());

/** A card she sells to clients: credits for their visits, for a number of months. */
export const membershipProductSchema = z.object({
	kind: z.literal("membership"),
	name,
	price,
	credits: numberFromInput(z.number().int("Credits are whole visits").min(1, "At least 1 credit")),
	durationMonths: numberFromInput(z.number().int("Whole months").min(1, "At least 1 month")),
});

/** A service she sells to partners: one session for a group of a given size. */
export const partnerServiceSchema = z
	.object({
		kind: z.literal("partner_service"),
		name,
		price,
		groupMin: optionalCount("At least 1 person"),
		groupMax: optionalCount("At least 1 person"),
	})
	.refine((v) => v.groupMin === null || v.groupMax === null || v.groupMin <= v.groupMax, {
		message: "Can't be fewer than the smallest group",
		path: ["groupMax"],
	});

export const productSchema = z.discriminatedUnion("kind", [membershipProductSchema, partnerServiceSchema]);

/** What the form holds while typing. */
export type ProductFormInput = z.input<typeof productSchema>;
/** What a valid form submits. */
export type ProductFormValues = z.output<typeof productSchema>;
