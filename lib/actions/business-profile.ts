"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { logServerError } from "@/lib/errors/server";
import { type StandardLegalLabel } from "@/lib/types/b2b";
import { db } from "@/services/database";
import { businessProfiles } from "@/services/database/schema";

export async function getBusinessProfileAction() {
	await requireUser();
	const result = await db.query.businessProfiles.findFirst();
	return result || null;
}

export async function upsertBusinessProfileAction(
	prevState: unknown,
	formData: FormData,
) {
	await requireUser();
	try {
		const id = formData.get("id") as string | null;
		const companyName = formData.get("companyName") as string;
		const email = formData.get("email") as string;
		const phone = formData.get("phone") as string;
		const address = formData.get("address") as string;
		const bankDetails = formData.get("bankDetails") as string;
		const showBankDetails = formData.get("showBankDetails") === "on";
		const logoBase64 = formData.get("logoBase64") as string | null;
		const signatureBase64 = formData.get("signatureBase64") as string | null;
		const operator = formData.get("operator") as string;

		const legalDetailsRaw = formData.get("legalDetails") as string;
		let legalDetails: { label: StandardLegalLabel; value: string }[] = [];
		try {
			if (legalDetailsRaw) {
				legalDetails = JSON.parse(legalDetailsRaw);
			}
		} catch (e) {
			console.error("Failed to parse legal details", e);
		}

		if (!companyName) {
			return { error: "Company Name is required." };
		}

		const data = {
			companyName,
			email,
			phone,
			address,
			bankDetails,
			showBankDetails,
			legalDetails,
			logoBase64,
			signatureBase64,
			operator,
			updatedAt: new Date(),
		};

		if (id) {
			// Check if there really is a record, even though there should be a singleton
			const existing = await getBusinessProfileAction();
			if (existing) {
				await db.update(businessProfiles).set(data);
			} else {
				await db.insert(businessProfiles).values(data);
			}
		} else {
			const existing = await getBusinessProfileAction();
			if (existing) {
				await db.update(businessProfiles).set(data);
			} else {
				await db.insert(businessProfiles).values(data);
			}
		}

		revalidatePath("/settings");
		return { success: true };
	} catch (error) {
		return { error: "Failed to save profile settings.", ref: logServerError("Failed to upsert business profile", error) };
	}
}
