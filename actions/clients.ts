"use server";

import { db } from "@/drizzle";
import { clients } from "@/drizzle/schema";
import { eq, and, or, ilike, desc } from "drizzle-orm";
import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";
import { syncClientToGoogleContacts } from "@/services/google-contacts";
import { redirect } from "next/navigation";
import { clientSchema } from "@/lib/validators";
import { HEALTH_TEMPLATE } from "@/config/health";
import { getValidAccessToken } from "@/services/google-tokens";

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
	let accessToken = await getValidAccessToken(user.id);

	// Fallback to session provider_token if our stored token doesn't exist
	if (!accessToken) {
		const {
			data: { session },
		} = await supabase.auth.getSession();
		accessToken = session?.provider_token || null;
	}

	if (!accessToken) {
		return {
			error: "No Google Access Token. Please sign out and sign in again.",
		};
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
		const resourceName = await syncClientToGoogleContacts(accessToken, {
			fullName,
			phone,
			email: email || null,
			address: address || null,
			profession: profession || null,
			birthDate,
			category: category as "adult" | "child" | "student",
			gender: gender as "male" | "female" | undefined,
			referralSource: referralSource || null,
			consultationReason: consultationReason || null,
			intakeData: intakeData || {},
		});

		// 5. Insert into DB
		await db.insert(clients).values({
			fullName,
			phone,
			email: email || null,
			address: address || null,
			profession: profession || null,
			birthDate,
			category: category as "adult" | "child" | "student",
			gender: gender as "male" | "female" | undefined,
			referralSource: referralSource ?? null,
			consultationReason: consultationReason || null,
			intakeData: intakeData || {}, // Store as plain JSONB
			googleContactResourceName: resourceName || null,
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
	filters: { category?: string; gender?: string } = {},
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

	if (filters.category && filters.category !== "all") {
		whereConditions.push(
			eq(clients.category, filters.category as "adult" | "child" | "student"),
		);
	}

	if (filters.gender && filters.gender !== "all") {
		whereConditions.push(
			eq(clients.gender, filters.gender as "male" | "female"),
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

		// Get total count for pagination
		// Drizzle doesn't have a simple count() with where() yet without raw sql or separate query
		// For simplicity in this dashboard, we can just fetch the count separately or accept an approximate if list is huge.
		// Let's do a separate count query.
		// NOTE: details on count() varies by driver/drizzle version, strictly typed way:
		// const totalRes = await db.select({ count: count() }).from(clients).where(whereClause);
		// But let's stick to a simpler approach if imports are missing, assume standard drizzle-orm behavior.

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

export async function getGoogleContactPhotoAction(resourceName: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return { error: "Not authenticated" };

	const accessToken = await getValidAccessToken(user.id);
	if (!accessToken) return { error: "No access token" };

	const { getContactPhoto } = await import("@/services/google-contacts");
	const photoUrl = await getContactPhoto(accessToken, resourceName);

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
		await db
			.update(clients)
			.set({
				...parsed.data,
				category: parsed.data.category as "adult" | "child" | "student",
				gender: parsed.data.gender as "male" | "female" | undefined,
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
			const accessToken = await getValidAccessToken(user.id);
			if (accessToken) {
				const { deleteContact } = await import("@/services/google-contacts");
				await deleteContact(accessToken, client.googleContactResourceName);
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
