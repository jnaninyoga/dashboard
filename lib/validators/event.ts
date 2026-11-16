import { z } from "zod";

import { numberFromInput } from "./shared";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a time");
const text = (max: number) => z.string().trim().max(max, `Keep it under ${max} characters`);

/** A whole number of places typed into a field that may stay empty. */
const places = z
	.union([z.number(), z.string(), z.null()])
	.transform((value, ctx) => {
		if (value === null || (typeof value === "string" && !value.trim())) return null;
		const n = Number(value);
		if (!Number.isInteger(n)) {
			ctx.addIssue({ code: "custom", message: "A whole number of places" });
			return z.NEVER;
		}
		return n;
	});

/**
 * An outdoor event as she writes it: French required, English optional,
 * the start and end as the studio's wall clock (it can last several days),
 * the place, the price, and a limit on places only when she sets one.
 */
export const eventSchema = z
	.object({
		titleFr: text(120),
		titleEn: text(120).default(""),
		descriptionFr: text(4000),
		descriptionEn: text(4000).default(""),
		startDate: date,
		startTime: time,
		endDate: date,
		endTime: time,
		placeName: text(160),
		placeMapsUrl: z.union([z.literal(""), z.url("Paste the Google Maps link, starting with https://")]).default(""),
		price: numberFromInput(z.number().min(0, "The price can't be negative")),
		limited: z.boolean().default(false),
		capacity: places.default(null),
	})
	.refine((v) => !v.limited || (v.capacity !== null && v.capacity >= 1), {
		message: "How many places? At least 1",
		path: ["capacity"],
	});

export type EventFormInput = z.input<typeof eventSchema>;
export type EventFormValues = z.output<typeof eventSchema>;

/** A reservation she adds by hand: who, how many, and how they booked. */
export const reservationSchema = z.object({
	name: text(120).min(2, "Their name"),
	phone: text(40).refine((v) => v.replace(/\D/g, "").length >= 8, "A full phone number"),
	partySize: numberFromInput(z.number().int("Whole people").min(1, "At least 1").max(50, "50 at most")),
	source: z.enum(["whatsapp", "phone", "in_person", "website"]),
	clientId: z.string().uuid().nullable().default(null),
});
