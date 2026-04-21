import {
	b2bContacts,
	b2bPartners,
	clients,
} from "@/services/database/schema";
import {
	Gender,
	HealthCategory,
	HealthSeverity,
	ReferralSource,
} from "@/lib/types";

import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// --- CLIENT SCHEMA ---
export const clientSchema = createInsertSchema(clients, {
	email: z
		.email({ message: "Invalid email address" })
		.nullable()
		.optional()
		.or(z.literal("")),
	birthDate: (schema: z.ZodString) =>
		schema.refine((date: string) => !isNaN(Date.parse(date)), {
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
					category: z.enum([
						HealthCategory.PHYSICAL,
						HealthCategory.MENTAL,
						HealthCategory.LIFESTYLE,
					]),
					condition: z.string(),
					severity: z.enum([
						HealthSeverity.INFO,
						HealthSeverity.WARNING,
						HealthSeverity.CRITICAL,
					]),
					isAlert: z.boolean(),
					treatment: z.string().optional(),
					startDate: z.string(),
				}),
			)
			.optional(),
		initialProductId: z.string().optional(),
	});

export type ClientFormValues = z.infer<typeof clientSchema>;

// --- CATEGORY SCHEMA ---
export const categorySchema = z.object({
	name: z.string().min(1, "Name is required"),
	discountType: z.enum(["percentage", "fixed"]),
	discountValue: z.number().min(0, "Value must be positive"),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

// --- B2B PARTNER SCHEMA ---
export const partnerSchema = createInsertSchema(b2bPartners, {
	companyName: z.string().min(1, "Company name is required"),
	address: z.string().optional().nullable(),
	taxId: z.string().optional().nullable(),
}).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export type PartnerFormValues = z.infer<typeof partnerSchema>;

// --- B2B CONTACT SCHEMA ---
export const contactSchema = createInsertSchema(b2bContacts, {
	fullName: z.string().min(1, "Full name is required"),
	role: z.string().optional().nullable(),
	email: z
		.string()
		.email("Invalid email address")
		.optional()
		.nullable()
		.or(z.literal("")),
	phone: z.string().optional().nullable().or(z.literal("")),
	partnerId: z.string().uuid("Please select a partner"),
}).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	googleContactResourceName: true,
	googleEtag: true,
});

export type ContactFormValues = z.infer<typeof contactSchema>;

// --- HELPERS ---
/**
 * String-based numeric validators for form fields.
 * HTML inputs produce strings — we validate them as strings here,
 * and convert to numbers in the server action at save time.
 */
export const numericStr = (min = 0, msg?: string) =>
	z.string()
		.min(1, msg || "Required")
		.refine((v) => !isNaN(Number(v)) && Number(v) >= min, {
			message: msg || `Must be ≥ ${min}`,
		});

export const b2bTierSchema = z.object({
	name: z.string().min(1, "Name is required"),
	price: numericStr(0, "Price must be positive"),
});

export type B2BTierFormValues = z.infer<typeof b2bTierSchema>;



export const documentLineSchema = z.object({
	description: z.string().min(1, "Description is required"),
	quantity: numericStr(0.01, "Min 0.01"),
	unitPrice: numericStr(0, "Min 0"),
	totalPrice: numericStr(0),
});


export type DocumentLineFormValues = z.infer<typeof documentLineSchema>;


// --- B2B DOCUMENT SCHEMA ---
export const documentSchema = z.object({
	partnerId: z.string().uuid("Please select a partner"),
	contactId: z.string().uuid().optional().nullable(),
	type: z.enum(["quote", "invoice"]),
	status: z.enum(["draft", "sent", "accepted", "cancelled", "paid"]),
	documentNumber: z.string().min(1, "Document number is required"),
	issueDate: z.string().min(1, "Issue date is required"),
	dueDate: z.string().optional().nullable(),
	subtotal: z.string().min(1),
	taxRate: z.string().min(1),
	totalAmount: z.string().min(1, "Total amount is required"),
	notes: z.string().optional().nullable(),
	parentDocumentId: z.string().uuid().optional().nullable(),
});


export type DocumentFormValues = z.infer<typeof documentSchema>;

// --- COMPOSITE DOCUMENT + LINES SCHEMA ---
export const createDocumentWithLinesSchema = z.object({
	document: documentSchema,
	lines: z
		.array(documentLineSchema)
		.min(1, "At least one line item is required"),
});

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

// --- SESSION SCHEMA (Booking flow) ---
export const sessionSchema = z
	.object({
		title: z.string().min(1, "Title is required"),
		dateStr: z.string().min(1, "Date is required"),
		startTimeStr: z.string().min(1, "Start time is required"),
		endTimeStr: z.string().min(1, "End time is required"),
		type: z.enum(["group", "private", "outdoor", "b2b"]),
		outdoorPrice: z.string().optional(),
		b2bTierId: z.string().optional(),
	})
	.refine(
		(data) => {
			return data.startTimeStr < data.endTimeStr;
		},
		{
			message: "End time must be after start time",
			path: ["endTimeStr"],
		},
	)
	.refine(
		(data) => {
			if (
				data.type === "outdoor" &&
				(!data.outdoorPrice || isNaN(Number(data.outdoorPrice)))
			) {
				return false;
			}
			return true;
		},
		{
			message: "Valid price is required for outdoor sessions",
			path: ["outdoorPrice"],
		},
	)
	.refine(
		(data) => {
			if (data.type === "b2b" && !data.b2bTierId) {
				return false;
			}
			return true;
		},
		{
			message: "Please select a B2B pricing tier",
			path: ["b2bTierId"],
		},
	);

export type SessionFormValues = z.infer<typeof sessionSchema>;
