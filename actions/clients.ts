"use server";

import { db } from "@/drizzle";
import { clients } from "@/drizzle/schema";
import { createClient } from "@/supabase/server";
import { getGoogleClient } from "@/lib/google";
import { redirect } from "next/navigation";
import { clientSchema } from "@/lib/validators";
import { HEALTH_TEMPLATE } from "@/config/health";
import { getValidAccessToken } from "@/services/google-tokens";

export async function createClientAction(prevState: unknown, formData: FormData) {
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

	// 1. Gather all dynamic intake fields from formData
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

	const rawData = {
		fullName: formData.get("fullName"),
		phone: formData.get("phone"),
		email: formData.get("email"),
		address: formData.get("address"),
		profession: formData.get("profession"),
		birthDate: formData.get("birthDate"),
		category: formData.get("category"),
		sex: formData.get("sex"),
		referralSource: formData.get("referralSource"),
		consultationReason: formData.get("consultationReason"),
		intakeData: intakeDataRaw,
	};

	const parsed = clientSchema.safeParse(rawData);

	if (!parsed.success) {
		return { error: "Validation failed", issues: parsed.error.format() };
	}

	const { 
		fullName, phone, email, address, profession, birthDate, category, 
		sex, referralSource, consultationReason, intakeData 
	} = parsed.data;

	try {
		const google = getGoogleClient(accessToken);
		const CONTACTS_LABEL = "JnaninYoga Clients";
		let labelResourceName = null;

		// 1. Label Logic
		try {
			const groupsRes = await google.people.contactGroups.list();
			const existingGroup = groupsRes.data.contactGroups?.find(
				(g) => g.name === CONTACTS_LABEL || g.formattedName === CONTACTS_LABEL
			);

			if (existingGroup?.resourceName) {
				labelResourceName = existingGroup.resourceName;
			} else {
				const newGroup = await google.people.contactGroups.create({
					requestBody: { contactGroup: { name: CONTACTS_LABEL } },
				});
				labelResourceName = newGroup.data.resourceName;
			}
		} catch (e) {
			console.error("Failed to manage contact groups:", e);
		}

		// 2. Birthday Logic
		const dateObj = new Date(birthDate);
		const birthdayValue = {
			date: {
				year: dateObj.getFullYear(),
				month: dateObj.getMonth() + 1,
				day: dateObj.getDate(),
			},
		};
		
		// 3. Construct Biography Note from HEALTH_TEMPLATE
		let bioNote = "Health & Lifestyle Dossier:\n===========================\n";
		
		HEALTH_TEMPLATE.forEach(section => {
			const sectionValues = section.fields
				.map(f => {
					const val = intakeData ? intakeData[f.key] : undefined;
					return val ? `- ${f.label}: ${val}` : null;
				})
				.filter(Boolean);
				
			if (sectionValues.length > 0) {
				bioNote += `\n[${section.label}]\n${sectionValues.join('\n')}\n`;
			}
		});

		if (consultationReason) {
			bioNote += `\nConsultation Reason: ${consultationReason}\n`;
		}

		// 4. Create Contact
		const contactRes = await google.people.people.createContact({
			requestBody: {
				names: [{ displayName: fullName, givenName: fullName }],
				phoneNumbers: [{ value: phone }],
				emailAddresses: email ? [{ value: email }] : undefined,
				addresses: address ? [{ formattedValue: address }] : undefined,
				occupations: profession ? [{ value: profession }] : undefined,
				birthdays: [birthdayValue],
				memberships: labelResourceName
					? [{ contactGroupMembership: { contactGroupResourceName: labelResourceName } }]
					: undefined,
				biographies: [{ value: bioNote.trim(), contentType: "TEXT_PLAIN" }],
				// Store Sex and Referral in UserDefined or extended fields if needed, 
				// but typically Biography is best for unstructured viewing in Contacts app.
			},
		});

		const resourceName = contactRes.data.resourceName;

		// 5. Insert into DB
		await db.insert(clients).values({
			fullName,
			phone,
			email: email || null,
			address: address || null,
			profession: profession || null,
			birthDate,
			category: category as "adult" | "child" | "student",
			sex: sex as "male" | "female" | undefined,
			referralSource: referralSource ?? null,
			consultationReason: consultationReason || null,
			intakeData: intakeData || {}, // Store as plain JSONB
			googleContactResourceName: resourceName,
		});
	} catch (err: unknown) {
		console.error("Error creating client:", err);
		const message = err instanceof Error ? err.message : "Failed to create client";
		return { error: message };
	}

	redirect("/clients");
}
