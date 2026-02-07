"use server";

import { db } from "@/drizzle";
import { clients } from "@/drizzle/schema";
import { createClient } from "@/supabase/server";
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
