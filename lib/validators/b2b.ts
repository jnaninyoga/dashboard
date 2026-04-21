import { b2bContacts, b2bPartners } from "@/services/database/schema";

import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { numericStr } from "./shared";

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

// --- B2B TIER SCHEMA ---
export const b2bTierSchema = z.object({
	name: z.string().min(1, "Name is required"),
	price: numericStr(0, "Price must be positive"),
});

export type B2BTierFormValues = z.infer<typeof b2bTierSchema>;
