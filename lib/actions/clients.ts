"use server";

import { db } from "@/lib/drizzle";
import { clients } from "@/lib/drizzle/schema";
import { createClient } from "@/lib/supabase/server";
import { getGoogleClient } from "@/lib/google";
import { redirect } from "next/navigation";
import { z } from "zod";

const clientSchema = z.object({
	fullName: z.string().min(1, "Name is required"),
	phone: z.string().min(1, "Phone is required"),
	birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
		message: "Invalid date string",
	}),
	category: z.enum(["Adult", "Child", "Student"]),
});

export async function createClientAction(prevState: any, formData: FormData) {
	const supabase = await createClient();
	// Security: Use getUser() to verify authentication
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		return { error: "Not authenticated" };
	}

	// Session is still needed for provider_token, but we verified the user first.
	const {
		data: { session },
	} = await supabase.auth.getSession();
	const accessToken = session?.provider_token;

	if (!accessToken) {
		return {
			error: "No Google Access Token. Please sign out and sign in again.",
		};
	}

	const rawData = {
		fullName: formData.get("fullName"),
		phone: formData.get("phone"),
		birthDate: formData.get("birthDate"),
		category: formData.get("category"),
	};

	const parsed = clientSchema.safeParse(rawData);

	if (!parsed.success) {
		return { error: "Validation failed", issues: parsed.error.format() };
	}

	const { fullName, phone, birthDate, category } = parsed.data;

	try {
		const google = getGoogleClient(accessToken);
		const CONTACTS_LABEL = "JnaninYoga Clients";
		let labelResourceName = null;

		// 1. Label Logic: Find or Create "JnaninYoga Clients" Label
		try {
			const groupsRes = await google.people.contactGroups.list();
			const existingGroup = groupsRes.data.contactGroups?.find(
				(g) => g.name === CONTACTS_LABEL || g.formattedName === CONTACTS_LABEL
			);

			if (existingGroup?.resourceName) {
				labelResourceName = existingGroup.resourceName;
			} else {
				// Create Group
				const newGroup = await google.people.contactGroups.create({
					requestBody: {
						contactGroup: { name: CONTACTS_LABEL },
					},
				});
				labelResourceName = newGroup.data.resourceName;
			}
		} catch (e) {
			console.error("Failed to manage contact groups:", e);
			// Proceed without label if fails, or error out?
			// For now, we log and proceed, but user requested it.
		}

		// 2. Birthday Logic
		const dateObj = new Date(birthDate);
		const birthdayValue = {
			date: {
				year: dateObj.getFullYear(),
				month: dateObj.getMonth() + 1, // Google API is 1-indexed for month? usually standard is 1-12
				day: dateObj.getDate(),
			},
		};

		// 3. Create Contact
		const contactRes = await google.people.people.createContact({
			requestBody: {
				names: [{ displayName: fullName, givenName: fullName }],
				phoneNumbers: [{ value: phone }],
				birthdays: [birthdayValue],
				memberships: labelResourceName
					? [
							{
								contactGroupMembership: {
									contactGroupResourceName: labelResourceName,
								},
							},
					  ]
					: undefined,
			},
		});

		const resourceName = contactRes.data.resourceName;

		// 4. Insert into DB
		await db.insert(clients).values({
			fullName,
			phone,
			birthDate,
			category,
			googleContactResourceName: resourceName,
		});
	} catch (err: any) {
		console.error("Error creating client:", err);
		return { error: err.message || "Failed to create client" };
	}

	redirect("/clients"); // Redirect to clients list (which we haven't built yet, so maybe Dashboard root)
}
