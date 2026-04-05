import { HEALTH_TEMPLATE } from "@/config/health";
import { getGoogleClient } from "@/lib/google";

interface ContactData {
	fullName: string;
	phone: string;
	email?: string | null;
	address?: string | null;
	profession?: string | null;
	birthDate: string;
	category: string;
	gender?: "male" | "female";
	referralSource?: string | null;
	consultationReason?: string | null;
	intakeData?: Record<string, string | undefined> | null;
}

interface SyncResult {
	resourceName: string;
	photoUrl: string | null;
}

const CONTACTS_LABEL = "JnaninYoga Clients";

export async function syncClientToGoogleContacts(
	accessToken: string,
	data: ContactData,
): Promise<SyncResult> {
	const google = getGoogleClient(accessToken);
	let labelResourceName = null;

	// 1. Label Logic (Get or Create)
	try {
		const groupsRes = await google.people.contactGroups.list();
		const existingGroup = groupsRes.data.contactGroups?.find(
			(g) => g.name === CONTACTS_LABEL || g.formattedName === CONTACTS_LABEL,
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
		// Proceed without label if this fails, rather than blocking creation
	}

	// 2. Birthday Logic
	const dateObj = new Date(data.birthDate);
	const birthdayValue = {
		date: {
			year: dateObj.getFullYear(),
			month: dateObj.getMonth() + 1,
			day: dateObj.getDate(),
		},
	};

	// 3. Construct Biography Note (Enhanced for Yoga Studio Context)
	let bioNote = "🧘 JnaninYoga Client Profile\n===========================\n";

	// Core Info Summary
	bioNote += `Category: ${data.category.charAt(0).toUpperCase() + data.category.slice(1)}\n`;
	if (data.gender)
		bioNote += `Gender: ${data.gender.charAt(0).toUpperCase() + data.gender.slice(1)}\n`;
	if (data.referralSource)
		bioNote += `Referral: ${data.referralSource.replace("_", " ")}\n`;
	bioNote += "\n";

	// Health & Lifestyle Context
	if (data.consultationReason) {
		bioNote += `[Reason for Consultation]\n${data.consultationReason}\n\n`;
	}

	HEALTH_TEMPLATE.forEach((section) => {
		const sectionValues = section.fields
			.map((f) => {
				const val = data.intakeData ? data.intakeData[f.key] : undefined;
				return val ? `- ${f.label}: ${val}` : null;
			})
			.filter(Boolean);

		if (sectionValues.length > 0) {
			bioNote += `[${section.label}]\n${sectionValues.join("\n")}\n`;
		}
	});

	// 4. Create Contact with Enhanced Fields
	const contactRes = await google.people.people.createContact({
		personFields: "photos", // Request photos in response
		requestBody: {
			names: [
				{
					displayName: data.fullName,
					givenName: data.fullName,
				},
			],
			phoneNumbers: [{ value: data.phone }],
			emailAddresses: data.email ? [{ value: data.email }] : undefined,
			addresses: data.address ? [{ formattedValue: data.address }] : undefined,
			occupations: data.profession ? [{ value: data.profession }] : undefined,
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
			biographies: [{ value: bioNote.trim(), contentType: "TEXT_PLAIN" }],
			// Add custom fields or userDefined fields if needed in future
			userDefined: [
				{ key: "Client Category", value: data.category },
				{ key: "Gender", value: data.gender || "Not specified" },
			],
		},
	});

	const resourceName = contactRes.data.resourceName;
	const photoUrl = contactRes.data.photos?.[0]?.url || null;

	if (!resourceName) {
		throw new Error("Failed to create contact in Google Contacts");
	}

	return { resourceName, photoUrl };
}

export async function updateClientInGoogleContacts(
	accessToken: string,
	resourceName: string,
	data: ContactData,
): Promise<string | null> {
	const google = getGoogleClient(accessToken);

	// 1. Get current Etag
	// We must fetch the person first to get the current etag for optimistic locking
	const current = await google.people.people.get({
		resourceName,
		personFields: "names,metadata",
	});
	const etag = current.data.etag;

	// 2. Birthday Logic (Reused)
	const dateObj = new Date(data.birthDate);
	const birthdayValue = {
		date: {
			year: dateObj.getFullYear(),
			month: dateObj.getMonth() + 1,
			day: dateObj.getDate(),
		},
	};

	// 3. Construct Biography Note (Reused logic - could be extracted but keeping inline for now)
	let bioNote = "🧘 JnaninYoga Client Profile\n===========================\n";
	bioNote += `Category: ${data.category.charAt(0).toUpperCase() + data.category.slice(1)}\n`;
	if (data.gender)
		bioNote += `Gender: ${data.gender.charAt(0).toUpperCase() + data.gender.slice(1)}\n`;
	if (data.referralSource)
		bioNote += `Referral: ${data.referralSource.replace("_", " ")}\n`;
	bioNote += "\n";
	if (data.consultationReason) {
		bioNote += `[Reason for Consultation]\n${data.consultationReason}\n\n`;
	}
	HEALTH_TEMPLATE.forEach((section) => {
		const sectionValues = section.fields
			.map((f) => {
				const val = data.intakeData ? data.intakeData[f.key] : undefined;
				return val ? `- ${f.label}: ${val}` : null;
			})
			.filter(Boolean);

		if (sectionValues.length > 0) {
			bioNote += `[${section.label}]\n${sectionValues.join("\n")}\n`;
		}
	});

	// 2. Push Update
	const updateRes = await google.people.people.updateContact({
		resourceName,
		updatePersonFields:
			"names,phoneNumbers,emailAddresses,addresses,occupations,birthdays,biographies,userDefined",
		personFields: "photos", // Request to return photos
		requestBody: {
			etag: etag,
			names: [
				{
					givenName: data.fullName,
					displayName: data.fullName,
				},
			],
			phoneNumbers: [{ value: data.phone }],
			emailAddresses: data.email ? [{ value: data.email }] : undefined,
			addresses: data.address ? [{ formattedValue: data.address }] : undefined,
			occupations: data.profession ? [{ value: data.profession }] : undefined,
			birthdays: [birthdayValue],
			biographies: [{ value: bioNote.trim(), contentType: "TEXT_PLAIN" }],
			userDefined: [
				{ key: "Client Category", value: data.category },
				{ key: "Gender", value: data.gender || "Not specified" },
			],
		},
	});

	return updateRes.data.photos?.[0]?.url || null;
}

export async function getContactPhoto(
	accessToken: string,
	resourceName: string,
	phone?: string,
): Promise<{ photoUrl: string | null; newResourceName?: string }> {
	// Ensure the resourceName starts with 'people/' if it doesn't already
	const sanitizedResourceName = resourceName.startsWith("people/")
		? resourceName
		: `people/${resourceName}`;

	const google = getGoogleClient(accessToken);

	// Try direct lookup first
	try {
		const person = await google.people.people.get({
			resourceName: sanitizedResourceName,
			personFields: "photos",
		});

		const photoUrl = person.data.photos?.[0]?.url;
		if (photoUrl) return { photoUrl };
	} catch {
		// Direct lookup failed (404 — contact may have been merged or ID changed).
		// Fall through to connections list fallback.
	}

	// Fallback: search through connections matching by phone number
	if (!phone) return { photoUrl: null };

	try {
		// Normalize the phone for comparison (strip spaces, dashes, etc.)
		const normalizePhone = (p: string) => p.replace(/[\s\-()]+/g, "");
		const normalizedPhone = normalizePhone(phone);

		const connections = await google.people.people.connections.list({
			resourceName: "people/me",
			personFields: "photos,phoneNumbers",
			pageSize: 1000,
		});

		for (const person of connections.data.connections || []) {
			const phones = person.phoneNumbers?.map((p) => normalizePhone(p.value || "")) || [];
			if (phones.some((p) => p === normalizedPhone || p.endsWith(normalizedPhone) || normalizedPhone.endsWith(p))) {
				const photoUrl = person.photos?.[0]?.url;
				if (photoUrl && person.resourceName) {
					return { photoUrl, newResourceName: person.resourceName };
				}
			}
		}
	} catch (error) {
		console.error("Error fetching contact photo via connections fallback:", error);
	}

	return { photoUrl: null };
}

export async function deleteContact(
	accessToken: string,
	resourceName: string,
): Promise<boolean> {
	try {
		const google = getGoogleClient(accessToken);
		await google.people.people.deleteContact({
			resourceName,
		});
		return true;
	} catch (error: unknown) {
		// Robust handling: If resource not found (404), consider it deleted/success
		const err = error as { code?: number; message?: string };
		if (err.code === 404 || err.message?.includes("not found")) {
			console.warn(
				`Contact ${resourceName} not found in Google (404). Assuming already deleted.`,
			);
			return true;
		}
		console.error("Error deleting contact:", err);
		return false;
	}
}
