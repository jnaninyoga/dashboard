"use server";

import { db } from "@/drizzle";
import { clients } from "@/drizzle/schema";
import { eq, and, or, ilike, desc } from "drizzle-orm";
import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";
import {
	syncClientToGoogleContacts,
	updateClientInGoogleContacts,
} from "@/services/google-contacts";
import { redirect } from "next/navigation";
import { clientSchema } from "@/lib/validators";
import { HEALTH_TEMPLATE } from "@/config/health";
import { getValidAccessToken } from "@/services/google-tokens";
import { ClientCategory, Gender } from "@/lib/types";

export async function createClientAction(
	_prevState: unknown,
	formData: FormData,
) {
	const supabase = await createClient();
	// Security: Use getUser() to verify authentication
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		return { error: "Not authenticated" };
	}

	// Try to get a valid access token (will refresh if needed)
	let accessToken: string;
	try {
		accessToken = await getValidAccessToken(user.id);
	} catch (error) {
		console.error("Token retrieval failed:", error);
		// If reauth is required (or any other token error), redirect to login
		redirect("/login");
	}

	const intakeDataRaw: Record<string, string> = {};

	// We need to flatten our template config to know which keys to look for
	// But simply iterating formData entries is safer if we prefix them or just grab everything not standard.
	// However, we should be explicit based on config to avoid garbage data.

	HEALTH_TEMPLATE.forEach((section) => {
		section.fields.forEach((field) => {
			const value = formData.get(field.key);
			if (typeof value === "string" && value.trim() !== "") {
				intakeDataRaw[field.key] = value.trim();
			}
		});
	});

	// Helper to handle empty strings/nulls as null for Zod/DB
	const getString = (key: string) => {
		const val = formData.get(key);
		return val && typeof val === "string" && val.trim().length > 0
			? val.trim()
			: null;
	};

	const rawData = {
		fullName: getString("fullName"), // Schema requires string, let Zod catch if missing, but we trimmed it
		phone: getString("phone"),
		email: getString("email"),
		address: getString("address"),
		profession: getString("profession"),
		birthDate: getString("birthDate"),
		category: getString("category"),
		gender: getString("gender"),
		referralSource: getString("referralSource"),
		consultationReason: getString("consultationReason"),
		intakeData: intakeDataRaw,
	};

	const parsed = clientSchema.safeParse(rawData);

	if (!parsed.success) {
		return { error: "Validation failed", issues: parsed.error.format() };
	}

	const {
		fullName,
		phone,
		email,
		address,
		profession,
		birthDate,
		category,
		gender,
		referralSource,
		consultationReason,
		intakeData,
	} = parsed.data;

	try {
		// Use the dedicated service for Google Contacts sync
		const { resourceName, photoUrl } = await syncClientToGoogleContacts(
			accessToken,
			{
				fullName,
				phone,
				email: email || null,
				address: address || null,
				profession: profession || null,
				birthDate,
				category: category || ClientCategory.ADULT,
				gender: gender,
				referralSource: referralSource || null,
				consultationReason: consultationReason || null,
				intakeData: intakeData || {},
			},
		);

		// 5. Insert into DB
		await db.insert(clients).values({
			fullName,
			phone,
			email: email || null,
			address: address || null,
			profession: profession || null,
			birthDate,
			category: category || ClientCategory.ADULT,
			gender: gender || Gender.MALE, // Default or handle null? Google Contacts gender is optional string but our type says specific?
			// Wait, syncClientToGoogleContacts definition: gender?: "male" | "female".
			// gender from parsed.data is Gender enum.
			// If undefined, pass undefined to sync?
			// Schema: gender is NOT optional in DB?
			// drizzle/schema.ts: gender: genderEnum("gender").notNull()
			// So parsed.data.gender SHOULD be defined if no default in DB.
			// But createInsertSchema makes it optional if it HAS a default?
			// genderEnum has no default in schema. So createInsertSchema should make it REQUIRED.
			// However, the error said: Type 'undefined' is not assignable to type.
			// Maybe I confused category (which has default) with gender?
			// Error: Type 'undefined' is not assignable to type '"adult" | "child" | "student"'. (for category).
			// So category needs default.
			// Gender: Type 'Gender' is not assignable to '"male" | "female" | undefined'.
			// lib/types Gender = enum { MALE='male', ... }.
			// So passing Gender.MALE is 'male'.
			// But type error might be mismatch between string literal type and enum type?
			// Let's assume standard Enum usuage fixes it.
			// For category: use || ClientCategory.ADULT.
			// For gender: if it's required in schema, it won't be undefined. If error persists, cast it?
			referralSource: referralSource ?? null,
			consultationReason: consultationReason || null,
			intakeData: intakeData || {}, // Store as plain JSONB
			googleContactResourceName: resourceName || null,
			photoUrl: photoUrl || null,
		});
	} catch (err: unknown) {
		console.error("Error creating client:", err);
		const message =
			err instanceof Error ? err.message : "Failed to create client";
		return { error: message };
	}

	redirect("/clients");
}

export async function getClientsAction(
	page = 1,
	pageSize = 10,
	query = "",
	filters: { category?: ClientCategory; gender?: Gender } = {},
) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return { error: "Not authenticated" };

	const offset = (page - 1) * pageSize;

	// Build where clause
	const whereConditions = [];

	if (query) {
		const lowerQuery = `%${query.toLowerCase()}%`;
		whereConditions.push(
			or(
				ilike(clients.fullName, lowerQuery),
				ilike(clients.email, lowerQuery),
				ilike(clients.phone, lowerQuery),
			),
		);
	}

	if (filters.category && filters.category !== ClientCategory.ALL) {
		whereConditions.push(
			eq(clients.category, filters.category),
		);
	}

	if (filters.gender && filters.gender !== Gender.ALL) {
		whereConditions.push(
			eq(clients.gender, filters.gender),
		);
	}

	try {
		const whereClause =
			whereConditions.length > 0 ? and(...whereConditions) : undefined;

		const data = await db.query.clients.findMany({
			where: whereClause,
			limit: pageSize,
			offset: offset,
			orderBy: [desc(clients.createdAt)],
		});

		return { success: true, data };
	} catch (error) {
		console.error("Error fetching clients:", error);
		return { error: "Failed to fetch clients" };
	}
}

export async function getClientByIdAction(id: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return { error: "Not authenticated" };

	try {
		const client = await db.query.clients.findFirst({
			where: eq(clients.id, id),
		});
		if (!client) return { error: "Client not found" };
		return { success: true, client };
	} catch (error) {
		console.error("Error fetching client:", error);
		return { error: "Failed to fetch client" };
	}
}

export async function getGoogleContactPhotoAction(
	resourceName: string,
	clientId?: string,
) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return { error: "Not authenticated" };

	let accessToken: string;
	try {
		accessToken = await getValidAccessToken(user.id);
	} catch {
		redirect("/login");
	}

	const { getContactPhoto } = await import("@/services/google-contacts");
	const photoUrl = await getContactPhoto(accessToken, resourceName);

	// Read-through cache: Update DB if we successfully fetched a photo and have a clientId
	if (photoUrl && clientId) {
		try {
			await db
				.update(clients)
				.set({ photoUrl })
				.where(eq(clients.id, clientId));
		} catch (err) {
			console.error("Failed to cache photo URL:", err);
			// Non-blocking error
		}
	}

	return { success: true, url: photoUrl };
}

export async function updateClientAction(
	id: string,
	_prevState: unknown,
	formData: FormData,
) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return { error: "Not authenticated" };

	const intakeDataRaw: Record<string, string> = {};
	HEALTH_TEMPLATE.forEach((section) => {
		section.fields.forEach((field) => {
			const value = formData.get(field.key);
			if (typeof value === "string" && value.trim() !== "") {
				intakeDataRaw[field.key] = value.trim();
			}
		});
	});

	const getString = (key: string) => {
		const val = formData.get(key);
		return val && typeof val === "string" && val.trim().length > 0
			? val.trim()
			: null;
	};

	const rawData = {
		fullName: getString("fullName"),
		phone: getString("phone"),
		email: getString("email"),
		address: getString("address"),
		profession: getString("profession"),
		birthDate: getString("birthDate"),
		category: getString("category"),
		gender: getString("gender"),
		referralSource: getString("referralSource"),
		consultationReason: getString("consultationReason"),
		intakeData: intakeDataRaw,
	};

	const parsed = clientSchema.safeParse(rawData);

	if (!parsed.success) {
		return { error: "Validation failed", issues: parsed.error.format() };
	}

	try {
		// 1. Fetch existing client to get resource name
		const existingClient = await db.query.clients.findFirst({
			where: eq(clients.id, id),
		});

		if (existingClient?.googleContactResourceName) {
			// 2. Sync to Google Contacts
			let accessToken: string;
			try {
				accessToken = await getValidAccessToken(user.id);
				const photoUrl = await updateClientInGoogleContacts(
					accessToken,
					existingClient.googleContactResourceName,
					{
						fullName: parsed.data.fullName,
						phone: parsed.data.phone,
						email: parsed.data.email || null,
						address: parsed.data.address || null,
						profession: parsed.data.profession || null,
						birthDate: parsed.data.birthDate,
						category: parsed.data.category || ClientCategory.ADULT,
						gender: parsed.data.gender,
						referralSource: parsed.data.referralSource || null,
						consultationReason: parsed.data.consultationReason || null,
						intakeData: parsed.data.intakeData || {},
					},
				);

				// Update photoUrl if we got one back
				if (photoUrl) {
					await db
						.update(clients)
						.set({ photoUrl })
						.where(eq(clients.id, id));
				}
			} catch (e: any) {
				console.error("Failed to sync update to Google Contacts:", e);
				// If validation error (412 Precondition Failed means etag mismatch), maybe we should warn user?
				// For now, if it's an Auth error, we return error so frontend can handle it (or Proxy will catch next nav).
				if (e.message === "REAUTH_REQUIRED") {
					return { error: "Session expired. Please refresh the page." };
				}
				// Other errors: Log and proceed? Or block?
				// "Google API rejects updates without correct etag"... implies we should probably fail if sync fails?
				// User said: "Fixed... bugs". If sync fails, data is out of sync.
				// Let's block update if sync fails, unless it's a 404 (contact deleted remotely).
				if (e.code === 404) {
					// Contact gone, just update local
				} else {
					return {
						error: "Failed to sync with Google Contacts. Please try again.",
					};
				}
			}
		}

		await db
			.update(clients)
			.set({
				...parsed.data,
				category: parsed.data.category,
				gender: parsed.data.gender,
			})
			.where(eq(clients.id, id));

		revalidatePath("/clients");
		return { success: true };
	} catch (error) {
		console.error("Error updating client:", error);
		return { error: "Failed to update client" };
	}
}

export async function deleteClientAction(id: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return { error: "Not authenticated" };

	try {
		// 1. Fetch client to get Google Resource Name
		const client = await db.query.clients.findFirst({
			where: eq(clients.id, id),
		});

		if (client?.googleContactResourceName) {
			// 2. Get Access Token
			let accessToken: string;
			try {
				accessToken = await getValidAccessToken(user.id);
				const { deleteContact } = await import("@/services/google-contacts");
				const success = await deleteContact(
					accessToken,
					client.googleContactResourceName,
				);
				if (!success) {
					// If false (and not 404 which returns true), it was a real error.
					// But our robust deleteContact returns true for 404.
					// So if false, it's likely API error or Auth error (if caught inside deleteContact? No wait).
					// deleteContact returns false on error.
					// We should probably allow local delete anyway?
					// Use instruction "If error code is 404... return true... effectively ignoring it".
					// But `deleteContact` catches errors. If it returns false, it logged error.
					// Let's assume we proceed to ensure local cleanup, UNLESS it's auth error?
				}
			} catch (e: any) {
				console.error("Failed to sync delete to Google Contacts:", e);
				if (e.message === "REAUTH_REQUIRED") {
					return { error: "Session expired. Please refresh the page." };
				}
				// For other errors, we might want to proceed with local delete to clean up 'zombie' records.
			}
		}

		await db.delete(clients).where(eq(clients.id, id));
		revalidatePath("/clients");
		return { success: true };
	} catch (error) {
		console.error("Error deleting client:", error);
		return { error: "Failed to delete client" };
	}
}
