import { cardLines, isSiteKey, MAX_CARD_LINE_LENGTH, MAX_CARD_LINES } from "@/lib/domain/website/cards";

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

/** The lines on a card, typed one per row in a text box (or already a list); read as a list. */
const cardLinesText = z
	.union([z.string(), z.array(z.string())])
	.default("")
	.transform((value) => (Array.isArray(value) ? value.join("\n") : value))
	.superRefine((text, ctx) => {
		const lines = cardLines(text);
		if (lines.length > MAX_CARD_LINES) ctx.addIssue({ code: "custom", message: `At most ${MAX_CARD_LINES} lines, so the cards keep the same height` });
		const long = lines.find((line) => line.length > MAX_CARD_LINE_LENGTH);
		if (long) ctx.addIssue({ code: "custom", message: `Keep each line under ${MAX_CARD_LINE_LENGTH} characters: “${long.slice(0, 24)}…”` });
	})
	.transform(cardLines);

/**
 * A card she sells to clients: credits for their visits, for a number of
 * months, and how it shows on the website (shown or not, its key in the
 * site's links, its place in the row, the Popular badge, its lines in French
 * and English).
 */
export const membershipProductSchema = z
	.object({
		kind: z.literal("membership"),
		name,
		price,
		credits: numberFromInput(z.number().int("Credits are whole visits").min(1, "At least 1 credit")),
		durationMonths: numberFromInput(z.number().int("Whole months").min(1, "At least 1 month")),
		onSite: z.boolean().default(false),
		siteKey: z.string().trim().toLowerCase().default(""),
		sitePosition: numberFromInput(z.number().int("A whole number").min(0, "0 or more")).default(0),
		popular: z.boolean().default(false),
		sitePointsFr: cardLinesText,
		sitePointsEn: cardLinesText,
	})
	.refine((v) => !v.onSite || isSiteKey(v.siteKey), {
		message: "Give it a key for the website: lowercase words joined by dashes, like start-to-align",
		path: ["siteKey"],
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
