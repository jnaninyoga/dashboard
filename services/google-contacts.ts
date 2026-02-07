import { getGoogleClient } from "@/lib/google";
import { HEALTH_TEMPLATE } from "@/config/health";

interface ContactData {
	fullName: string;
	phone: string;
	email?: string | null;
	address?: string | null;
	profession?: string | null;
	birthDate: string;
	category: "adult" | "child" | "student";
	gender?: "male" | "female";
	referralSource?: string | null;
	consultationReason?: string | null;
	intakeData?: Record<string, string | undefined> | null;
}

const CONTACTS_LABEL = "JnaninYoga Clients";

export async function syncClientToGoogleContacts(
	accessToken: string,
	data: ContactData,
) {
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

	return contactRes.data.resourceName;
}
