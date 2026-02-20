import { createInsertSchema } from "drizzle-zod";
import { clients } from "@/drizzle/schema";
import { z } from "zod";
import { ClientCategory, Gender, ReferralSource } from "@/lib/types";

export const clientSchema = createInsertSchema(clients, {
	email: z
		.string()
		.email({ message: "Invalid email address" })
		.nullable()
		.optional()
		.or(z.literal("")),
	birthDate: (schema) =>
		schema.refine((date) => !isNaN(Date.parse(date)), {
			message: "Invalid date string",
		}),
	fullName: z.string().min(2, { message: "Name is required (min 2 chars)" }),
	phone: z
		.string()
		.min(10, { message: "Phone number must be at least 10 characters" })
		.regex(/^\+?[\d\s-()]+$/, {
			message: "Phone number can only contain digits, spaces, and dashes",
		})
		.refine((val) => val.replace(/\D/g, "").length >= 10, {
			message: "Phone number must contain at least 10 digits",
		}),
	// categoryId replaces the old category enum
	categoryId: z
		.string()
		.uuid({
			message: "Please select a valid category",
		})
		.optional()
		.nullable()
		.or(z.literal("")),
	gender: z.enum([Gender.MALE, Gender.FEMALE], {
		message: "Please select a gender",
	}),
	referralSource: z
		.enum([
			ReferralSource.SOCIAL_MEDIA,
			ReferralSource.WEBSITE,
			ReferralSource.FRIEND,
			ReferralSource.PROFESSIONAL_NETWORK,
			ReferralSource.OTHER,
		])
		.optional(),
	intakeData: z.record(z.string(), z.string().optional()).optional(),
})
	.omit({
		id: true,
		createdAt: true,
		googleContactResourceName: true,
		photoUrl: true,
	})
	.extend({
		healthLogs: z
			.array(
				z.object({
					category: z.string(),
					condition: z.string(),
					severity: z.string(),
					isAlert: z.boolean(),
					treatment: z.string().optional(),
					startDate: z.string(),
				}),
			)
			.optional(),
		initialProductId: z.string().optional(),
	});

export type ClientFormValues = z.infer<typeof clientSchema>;
