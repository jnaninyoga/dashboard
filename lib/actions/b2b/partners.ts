"use server";

import { revalidatePath } from "next/cache";

import { logServerError } from "@/lib/errors/server";
import { B2BDocumentStatus, B2BDocumentType, type PartnerWithRelations } from "@/lib/types/b2b";
import { contactSchema, partnerSchema } from "@/lib/validators";
import { db } from "@/services/database";
import { b2bContacts, b2bDocuments, b2bPartners } from "@/services/database/schema";
import { syncPartnerContactToGoogle } from "@/services/google";
import { getValidAccessToken } from "@/services/google";
import { createClient } from "@/services/supabase/server";

import { and, count, eq, exists, ilike, or } from "drizzle-orm";

export type ActionState = {
	error?: string;
	/** Code the failure was logged under; shown in the error toast. */
	ref?: string;
	success?: boolean;
	issues?: Record<string, string[]>;
};

export async function createPartnerAction(
	prevState: ActionState | null,
	formData: FormData
): Promise<ActionState> {
	const rawData = {
		companyName: formData.get("companyName"),
		address: formData.get("address") || null,
		taxId: formData.get("taxId") || null,
	};

	const validated = partnerSchema.safeParse(rawData);

	if (!validated.success) {
		return {
			error: "Validation failed",
			issues: validated.error.flatten().fieldErrors,
		};
	}

	try {
		await db.insert(b2bPartners).values(validated.data);

		revalidatePath("/b2b/partners");
		return { success: true };
	} catch (error) {
		return { error: "Failed to create partner", ref: logServerError("Error creating partner", error) };
	}
}

export async function createContactAction(
	prevState: ActionState | null,
	formData: FormData
): Promise<ActionState> {
	const rawData = {
		partnerId: formData.get("partnerId"),
		fullName: formData.get("fullName"),
		role: formData.get("role") || null,
		email: formData.get("email") || null,
		phone: formData.get("phone") || null,
		isPrimary: formData.get("isPrimary") === "on",
	};

	const validated = contactSchema.safeParse(rawData);

	if (!validated.success) {
		return {
			error: "Validation failed",
			issues: validated.error.flatten().fieldErrors,
		};
	}

	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	
	if (!user) {
		return { error: "Not authenticated" };
	}

	try {
		const { partnerId, fullName, role, email, phone, isPrimary } = validated.data;

		// 1. Fetch partner to get companyName for Google Sync
		const partner = await db.query.b2bPartners.findFirst({
			where: eq(b2bPartners.id, partnerId),
		});

		if (!partner) {
			return { error: "Partner not found" };
		}

		// 2. Sync to Google Contacts
		let googleResourceName = null;
		let googleEtag = null;
		
		try {
			const accessToken = await getValidAccessToken(user.id);
			const syncResult = await syncPartnerContactToGoogle(
				accessToken,
				{ 
					fullName, 
					role, 
					email, 
					phone 
				},
				partner.companyName
			);
			googleResourceName = syncResult.resourceName;
			googleEtag = syncResult.etag;
		} catch (e) {
			console.error("Google Sync failed for B2B contact:", e);
		}

		// 3. Insert into database
		await db.insert(b2bContacts).values({
			partnerId,
			fullName,
			role,
			email,
			phone,
			isPrimary,
			googleContactResourceName: googleResourceName,
			googleEtag: googleEtag,
		});

		revalidatePath(`/b2b/partners/${partnerId}`);
		return { success: true };
	} catch (error) {
		return { error: "Failed to create contact", ref: logServerError("Error creating B2B contact", error) };
	}
}

export async function updatePartnerAction(
	id: string,
	prevState: ActionState | null,
	formData: FormData,
): Promise<ActionState> {
	const rawData = {
		companyName: formData.get("companyName"),
		address: formData.get("address") || null,
		taxId: formData.get("taxId") || null,
	};

	const validated = partnerSchema.safeParse(rawData);
	if (!validated.success) {
		return {
			error: "Validation failed",
			issues: validated.error.flatten().fieldErrors,
		};
	}

	try {
		await db
			.update(b2bPartners)
			.set({ ...validated.data, updatedAt: new Date() })
			.where(eq(b2bPartners.id, id));

		revalidatePath("/b2b/partners");
		revalidatePath(`/b2b/partners/${id}`);
		// Status guards on document issuance read partner.taxId — keep them in sync.
		revalidatePath("/b2b/documents");
		return { success: true };
	} catch (error) {
		return { error: "Failed to update partner", ref: logServerError("Error updating partner", error) };
	}
}

export async function deletePartnerAction(id: string): Promise<ActionState> {
	try {
		// Check for associated documents (prevent deleting partner if they have quotes/invoices)
		const docsCount = await db
			.select({ value: count() })
			.from(b2bDocuments)
			.where(eq(b2bDocuments.partnerId, id));

		if (docsCount[0].value > 0) {
			return { 
				error: "Cannot delete partner. They have associated documents (Quotes/Invoices). Delete those first." 
			};
		}

		await db.delete(b2bPartners).where(eq(b2bPartners.id, id));
		
		revalidatePath("/b2b/partners");
		return { success: true };
	} catch (error) {
		return { error: "Failed to delete partner", ref: logServerError("Error deleting partner", error) };
	}
}

export async function getPartnersAction(filters?: {
	query?: string;
	docType?: B2BDocumentType | "all";
	docStatus?: B2BDocumentStatus | "all";
}): Promise<{ partners?: PartnerWithRelations[]; error?: string; ref?: string }> {

	const { query, docType, docStatus } = filters || {};

	try {
		const partners = (await db.query.b2bPartners.findMany({
			where: (partners) => {
				const conditions = [];

				if (query) {
					conditions.push(
						or(
							ilike(partners.companyName, `%${query}%`),
							ilike(partners.address ?? "", `%${query}%`),
							exists(
								db.select()
									.from(b2bContacts)
									.where(
										and(
											eq(b2bContacts.partnerId, partners.id),
											or(
												ilike(b2bContacts.fullName, `%${query}%`),
												ilike(b2bContacts.phone ?? "", `%${query}%`),
												ilike(b2bContacts.email ?? "", `%${query}%`)
											)
										)
									)
							)
						)
					);
				}

				if (docType && docType !== "all") {
					conditions.push(
						exists(
							db.select()
								.from(b2bDocuments)
								.where(
									and(
										eq(b2bDocuments.partnerId, partners.id),
										eq(b2bDocuments.type, docType)
									)
								)
						)
					);
				}

				if (docStatus && docStatus !== "all") {
					conditions.push(
						exists(
							db.select()
								.from(b2bDocuments)
								.where(
									and(
										eq(b2bDocuments.partnerId, partners.id),
										eq(b2bDocuments.status, docStatus)
									)
								)
						)
					);
				}

				return conditions.length > 0 ? and(...conditions) : undefined;
			},
			with: {
				contacts: true,
				documents: true,
			},
			orderBy: (partners, { desc }) => [desc(partners.createdAt)],
		})) as PartnerWithRelations[];

		return { partners };
	} catch (error) {
		return { error: "Failed to fetch partners", ref: logServerError("Error fetching partners", error) };
	}
}

export async function getPartnerByIdAction(id: string) {
	try {
		const partner = (await db.query.b2bPartners.findFirst({
			where: eq(b2bPartners.id, id),
			with: {
				contacts: {
					orderBy: (contacts, { desc }) => [desc(contacts.createdAt)],
				},
				documents: {
					with: {
						contact: true,
					},
					orderBy: (docs, { desc }) => [desc(docs.issueDate)],
				},
			},
		})) as PartnerWithRelations | null;
		return { partner };

	} catch (error) {
		return { error: "Failed to fetch partner", ref: logServerError("Error fetching partner", error) };
	}
}

export async function deleteContactAction(id: string): Promise<ActionState> {
	try {
		const contact = await db.query.b2bContacts.findFirst({
			where: eq(b2bContacts.id, id),
		});

		if (!contact) {
			return { error: "Contact not found" };
		}

		await db.delete(b2bContacts).where(eq(b2bContacts.id, id));

		revalidatePath(`/b2b/partners/${contact.partnerId}`);
		return { success: true };
	} catch (error) {
		return { error: "Failed to delete contact", ref: logServerError("Error deleting contact", error) };
	}
}
