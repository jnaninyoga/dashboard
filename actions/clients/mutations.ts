"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { HEALTH_TEMPLATE } from "@/config/health";
import { db } from "@/drizzle";
import {
	clientCategories,
	clients,
	clientWallets,
	healthLogs,
	membershipProducts,
} from "@/drizzle/schema";
import { Gender, type NewHealthLog } from "@/lib/types";
import { clientSchema } from "@/lib/validators";
import {
	syncClientToGoogleContacts,
	updateClientInGoogleContacts,
} from "@/services/google";
import { getValidAccessToken } from "@/services/google";
import { createClient } from "@/supabase/server";

import { and, eq, isNull } from "drizzle-orm";

// Helper to handle empty strings/nulls as null for Zod/DB
const getString = (formData: FormData, key: string) => {
	const val = formData.get(key);
	return val && typeof val === "string" && val.trim().length > 0
		? val.trim()
		: null;
};

export async function createClientAction(
	_prevState: unknown,
	formData: FormData,
) {
	const supabase = await createClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		return { error: "Not authenticated" };
	}

	let accessToken: string;
	try {
		accessToken = await getValidAccessToken(user.id);
	} catch (error) {
		console.error("Token retrieval failed:", error);
		redirect("/login");
	}

	const intakeDataRaw: Record<string, string> = {};
	HEALTH_TEMPLATE.forEach((section) => {
		section.fields.forEach((field) => {
			const value = formData.get(field.key);
			if (typeof value === "string" && value.trim() !== "") {
				intakeDataRaw[field.key] = value.trim();
			}
		});
	});

	const rawData = {
		fullName: getString(formData, "fullName"),
		phone: getString(formData, "phone"),
		email: getString(formData, "email"),
		address: getString(formData, "address"),
		profession: getString(formData, "profession"),
		birthDate: getString(formData, "birthDate"),
		categoryId: getString(formData, "categoryId"),
		gender: getString(formData, "gender"),
		referralSource: getString(formData, "referralSource"),
		consultationReason: getString(formData, "consultationReason"),
		intakeData: intakeDataRaw,
		healthLogs: formData.get("healthLogs")
			? JSON.parse(formData.get("healthLogs") as string)
			: [],
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
		categoryId,
		gender,
		referralSource,
		consultationReason,
		intakeData,
	} = parsed.data;

	const initialProductId = formData.get("initialProductId") as string | null;

	try {
		let clientWithId: { id: string }[] = [];

		await db.transaction(async (tx) => {
			let categoryName = "Uncategorized";

			if (categoryId) {
				const categoryObj = await tx.query.clientCategories.findFirst({
					where: eq(clientCategories.id, categoryId as string),
					columns: { name: true },
				});
				if (categoryObj) {
					categoryName = categoryObj.name;
				}
			}

			const { resourceName, photoUrl } = await syncClientToGoogleContacts(
				accessToken,
				{
					fullName,
					phone,
					email: email || null,
					address: address || null,
					profession: profession || null,
					birthDate,
					category: categoryName,
					gender: gender,
					referralSource: referralSource || null,
					consultationReason: consultationReason || null,
					intakeData: intakeData || {},
				},
			);

			clientWithId = await tx
				.insert(clients)
				.values({
					fullName,
					phone,
					email: email || null,
					address: address || null,
					profession: profession || null,
					birthDate,
					categoryId: categoryId,
					gender: gender || Gender.MALE,
					referralSource: referralSource ?? null,
					consultationReason: consultationReason || null,
					intakeData: intakeData || {},
					googleContactResourceName: resourceName || null,
					photoUrl: photoUrl || null,
				})
				.returning({ id: clients.id });

			const newClientId = clientWithId[0].id;

			const logsToInsert: NewHealthLog[] = [];
			const nowStr = new Date().toISOString().split("T")[0];

			if (parsed.data.healthLogs && parsed.data.healthLogs.length > 0) {
				parsed.data.healthLogs.forEach((log) => {
					logsToInsert.push({
						clientId: newClientId,
						category: log.category,
						severity: log.severity,
						condition: log.condition,
						treatment: log.treatment || null,
						isAlert: log.isAlert,
						startDate: log.startDate || nowStr,
					});
				});
			}

			if (logsToInsert.length > 0) {
				await tx.insert(healthLogs).values(logsToInsert);
			}

			if (initialProductId) {
				const product = await tx.query.membershipProducts.findFirst({
					where: eq(membershipProducts.id, initialProductId),
				});

				if (product) {
					await tx.insert(clientWallets).values({
						clientId: newClientId,
						productId: initialProductId,
						remainingCredits: product.defaultCredits,
						status: "active",
						amountPaid: product.basePrice,
						activatedAt: new Date(),
					});
				}
			}
		});

		revalidatePath("/clients");
		return { success: true };
	} catch (err: unknown) {
		console.error("Error creating client:", err);
		const message =
			err instanceof Error ? err.message : "Failed to create client";
		return { error: message };
	}
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

	const rawData = {
		fullName: getString(formData, "fullName"),
		phone: getString(formData, "phone"),
		email: getString(formData, "email"),
		address: getString(formData, "address"),
		profession: getString(formData, "profession"),
		birthDate: getString(formData, "birthDate"),
		category: getString(formData, "category"),
		gender: getString(formData, "gender"),
		referralSource: getString(formData, "referralSource"),
		consultationReason: getString(formData, "consultationReason"),
		intakeData: intakeDataRaw,
		healthLogs: formData.get("healthLogs")
			? JSON.parse(formData.get("healthLogs") as string)
			: [],
	};

	const parsed = clientSchema.safeParse(rawData);

	if (!parsed.success) {
		return { error: "Validation failed", issues: parsed.error.format() };
	}

	const { healthLogs: submittedLogs } = parsed.data;

	try {
		await db.transaction(async (tx) => {
			const {
				healthLogs: _healthLogs,
				...clientUpdateData
			} = parsed.data;

			await tx
				.update(clients)
				.set({
					...clientUpdateData,
					categoryId: parsed.data.categoryId,
					gender: parsed.data.gender,
					intakeData: parsed.data.intakeData || {},
				})
				.where(eq(clients.id, id));

			const existingLogs = await tx.query.healthLogs.findMany({
				where: eq(healthLogs.clientId, id),
			});

			const nowStr = new Date().toISOString().split("T")[0];

			if (submittedLogs && submittedLogs.length > 0) {
				const submittedConditions = new Set(
					submittedLogs.map((l) => l.condition.trim().toLowerCase()),
				);

				for (const log of submittedLogs) {
					const match = existingLogs.find(
						(ex) =>
							ex.condition.trim().toLowerCase() ===
								log.condition.trim().toLowerCase() && !ex.endDate,
					);

					if (match) {
						if (
							match.severity !== log.severity ||
							match.isAlert !== log.isAlert ||
							match.treatment !== (log.treatment || null)
						) {
							await tx
								.update(healthLogs)
								.set({
									severity: log.severity,
									isAlert: log.isAlert,
									treatment: log.treatment || null,
								})
								.where(eq(healthLogs.id, match.id));
						}
					} else {
						await tx.insert(healthLogs).values({
							clientId: id,
							category: log.category,
							condition: log.condition,
							severity: log.severity,
							treatment: log.treatment || null,
							isAlert: log.isAlert,
							startDate: log.startDate || nowStr,
						});
					}
				}

				for (const ex of existingLogs) {
					if (
						!ex.endDate &&
						!submittedConditions.has(ex.condition.trim().toLowerCase())
					) {
						await tx
							.update(healthLogs)
							.set({ endDate: nowStr, isAlert: false })
							.where(eq(healthLogs.id, ex.id));
					}
				}
			} else {
				if (submittedLogs) {
					await tx
						.update(healthLogs)
						.set({ endDate: nowStr, isAlert: false })
						.where(
							and(eq(healthLogs.clientId, id), isNull(healthLogs.endDate)),
						);
				}
			}
		});

		const existingClient = await db.query.clients.findFirst({
			where: eq(clients.id, id),
		});

		if (existingClient?.googleContactResourceName) {
			let accessToken: string;
			try {
				accessToken = await getValidAccessToken(user.id);

				let categoryName = "Uncategorized";
				if (parsed.data.categoryId) {
					const categoryObj = await db.query.clientCategories.findFirst({
						where: eq(clientCategories.id, parsed.data.categoryId as string),
						columns: { name: true },
					});
					if (categoryObj) {
						categoryName = categoryObj.name;
					}
				}

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
						category: categoryName,
						gender: parsed.data.gender,
						referralSource: parsed.data.referralSource || null,
						consultationReason: parsed.data.consultationReason || null,
						intakeData: parsed.data.intakeData || {},
					},
				);

				if (photoUrl) {
					await db.update(clients).set({ photoUrl }).where(eq(clients.id, id));
				}
			} catch (e: unknown) {
				console.error("Failed to sync update to Google Contacts:", e);
				const err = e as { message?: string; code?: number };
				if (err.message === "REAUTH_REQUIRED") {
					return { error: "Session expired. Please refresh the page." };
				}
				if (err.code === 404) {
					// skip
				} else {
					return {
						error: "Failed to sync with Google Contacts. Please try again.",
					};
				}
			}
		}

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
		const client = await db.query.clients.findFirst({
			where: eq(clients.id, id),
		});

		if (client?.googleContactResourceName) {
			let accessToken: string;
			try {
				accessToken = await getValidAccessToken(user.id);
				const { deleteContact } = await import("@/services/google");
				await deleteContact(
					accessToken,
					client.googleContactResourceName,
				);
			} catch (e: unknown) {
				console.error("Failed to sync delete to Google Contacts:", e);
				const err = e as { message?: string };
				if (err.message === "REAUTH_REQUIRED") {
					return { error: "Session expired. Please refresh the page." };
				}
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

	let phone: string | undefined;
	if (clientId) {
		try {
			const client = await db.query.clients.findFirst({
				where: eq(clients.id, clientId),
				columns: { phone: true },
			});
			phone = client?.phone;
		} catch {
			// skip
		}
	}

	const { getContactPhoto } = await import("@/services/google");
	const { photoUrl, newResourceName } = await getContactPhoto(accessToken, resourceName, phone);

	if (clientId && (photoUrl || newResourceName)) {
		try {
			const updates: Record<string, string> = {};
			if (photoUrl) updates.photoUrl = photoUrl;
			if (newResourceName) updates.googleContactResourceName = newResourceName;
			await db
				.update(clients)
				.set(updates)
				.where(eq(clients.id, clientId));
		} catch (err) {
			console.error("Failed to cache photo URL:", err);
		}
	}

	return { success: true, url: photoUrl };
}
