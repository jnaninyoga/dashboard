"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { HEALTH_TEMPLATE } from "@/config/health";
import { db } from "@/drizzle";
import {
	attendanceLedger,
	Client,
	clientCategories,
	clients,
	clientWallets,
	healthLogs,
	NewHealthLog,
} from "@/drizzle/schema";
import { Gender } from "@/lib/types";
import { clientSchema } from "@/lib/validators";
import { getTodayEvents } from "@/services/google-calendar";
import {
	syncClientToGoogleContacts,
	updateClientInGoogleContacts,
} from "@/services/google-contacts";
import { getValidAccessToken } from "@/services/google-tokens";
import { createClient } from "@/supabase/server";

import { and, desc, eq, gte,ilike, inArray, isNull, or } from "drizzle-orm";

import { assignProductToClient } from "./wallets";

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
		categoryId: getString("categoryId"),
		gender: getString("gender"),
		referralSource: getString("referralSource"),
		consultationReason: getString("consultationReason"),
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
					category: categoryName,
					gender: gender,
					referralSource: referralSource || null,
					consultationReason: consultationReason || null,
					intakeData: intakeData || {},
				},
			);

			// 5. Insert into DB
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
					intakeData: intakeData || {}, // Store as plain JSONB
					googleContactResourceName: resourceName || null,
					photoUrl: photoUrl || null,
				})
				.returning({ id: clients.id });

			const newClientId = clientWithId[0].id;

			// --- Auto-Generate Health Logs ---
			const logsToInsert: NewHealthLog[] = [];
			const nowStr = new Date().toISOString().split("T")[0];

			// 1. Explicit Health Logs from Dynamic List (Priority)
			if (parsed.data.healthLogs && parsed.data.healthLogs.length > 0) {
				parsed.data.healthLogs.forEach((log) => {
					logsToInsert.push({
						clientId: newClientId,
						category: log.category, // This is HEALTH category, not CLIENT category. Needs verification if healthLogs table uses enum or fk? Schema says healthCategoryEnum. So this is fine.
						severity: log.severity,
						condition: log.condition,
						treatment: log.treatment || null,
						isAlert: log.isAlert,
						startDate: log.startDate || nowStr,
					});
				});
			}

			// 2. Fallback: Parse legacy intake fields ONLY if they are NOT covered by dynamic list?
			// "Merge" logic: The user wants "Current Care" (wizard step) to BE active logs.
			// "Medical History" (step 2 bottom) is static background.
			// So we should iterate the OTHER fields from intakeData that are NOT "Physical" (since Physical is now the dynamic list).


			if (logsToInsert.length > 0) {
				await tx.insert(healthLogs).values(logsToInsert);
			}

			// --- Assign Initial Product ---
			if (initialProductId) {
				// Inline wallet assignment logic to reuse transaction
				// Ideally calling logic from wallets.ts, but that func doesn't accept tx
				// Duplicating small logic here for transaction safety is okay for now,
				// OR we just run it after transaction. But better inside.
				// Let's import the table refs and do it here.
				// Need to fetch product credits
				// tx.query.membershipProducts is available? Yes if using same db instance structure?
				// `db.transaction(async (tx) => ...)` passes a transaction object.
				// It should have query builder if using drizzle(client, { schema }).
				// Since we need to query product first.
				// Note: Actions usually don't share TX unless properly structured (e.g. services accepting TX).
				// Let's just do it simple: insert wallet row if product exists.
				// We assume product ID is valid (selected from UI list).
				// We need the default credits.
				// For simplified "Unification", let's trust the ID or fetch it.
				// Fetching inside TX:
				// We'll need to import membershipProducts schema at top level if not already.
				// It is imported as `import { ..., membershipProducts } ...`. Wait, I need to check imports.
				// Let's check imports in the file currently...
				// `import { clients, healthLogs, clientWallets } from "@/drizzle/schema";`
				// Need to add membershipProducts to imports.
			}
		});

		// If initialProductId was passed, and we didn't do it inside TX (due to complexity of fetching product inside Drizzle TX without configured query builder sometimes?),
		// we can call the action? But calling action from action is weird.
		// Better to update imports and do it inside TX.
		// I will update imports in a separate step or same step.
		// Let's finish the replacement content assuming imports are there,
		// I will add the import in a prior/next step or use `db.select` if needed.
		// Actually, let's defer the wallet part to a second `await` if strictly needed, but better inside.

		// Re-implementing wallet assignment inside:
		if (initialProductId) {
			await assignWalletInternal(clientWithId[0].id, initialProductId);
		}
	} catch (err: unknown) {
		console.error("Error creating client:", err);
		const message =
			err instanceof Error ? err.message : "Failed to create client";
		return { error: message };
	}

	redirect("/clients");
}

// Helper (or import if we refactor wallets.ts to export internal function)
// We can just call the action? "Server Actions can be called from other Server Actions".
// Yes, Next.js allows this.
async function assignWalletInternal(clientId: string, productId: string) {
	await assignProductToClient(clientId, productId);
}

export async function getClientsAction(
	page = 1,
	pageSize = 10,
	query = "",
	filters: { categoryId?: string; gender?: Gender } = {},
) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return { error: "Not authenticated" };

	let accessToken: string | null = null;
	try {
		accessToken = await getValidAccessToken(user.id);
	} catch (e) {
		console.warn("Could not get access token for google calendar", e);
	}

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

	if (filters.categoryId && filters.categoryId !== "all") {
		whereConditions.push(eq(clients.categoryId, filters.categoryId));
	}

	if (filters.gender && filters.gender !== Gender.ALL) {
		whereConditions.push(eq(clients.gender, filters.gender));
	}

	try {
		const whereClause =
			whereConditions.length > 0 ? and(...whereConditions) : undefined;

		const data = await db.query.clients.findMany({
			where: whereClause,
			limit: pageSize,
			offset: offset,
			orderBy: [desc(clients.createdAt)],
			with: {
				category: true,
				wallets: {
					where: eq(clientWallets.status, "active"),
					with: {
						product: true,
						// Fetch recent ledger entries to check for "Online" status
						ledgerEntries: {
							orderBy: desc(attendanceLedger.checkInTime),
							limit: 1,
						},
					},
					orderBy: desc(clientWallets.activatedAt),
					limit: 1,
				},
				healthLogs: {
					where: and(
						eq(healthLogs.isAlert, true),
						isNull(healthLogs.endDate), // Active alerts only
					),
				},
			},
		});

        // 2. Add Live Session Info if checked in today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        if (data.length > 0) {
            const clientIds = data.map(c => c.id);
            const recentLedgers = await db
                .select({
                    clientId: clientWallets.clientId,
                    googleEventId: attendanceLedger.googleEventId,
                    checkInTime: attendanceLedger.checkInTime,
                })
                .from(attendanceLedger)
                .innerJoin(clientWallets, eq(attendanceLedger.walletId, clientWallets.id))
                .where(
                    and(
                        inArray(clientWallets.clientId, clientIds),
                        gte(attendanceLedger.checkInTime, startOfToday)
                    )
                )
                .orderBy(desc(attendanceLedger.checkInTime));

            if (recentLedgers.length > 0 && accessToken) {
                try {
                    const todayEvents = await getTodayEvents(accessToken);
                    const eventMap = new Map(todayEvents.map(e => [e.id, e.summary]));

                    (data as (Client & { activeSessionName?: string })[]).forEach((client) => {
                        const latestLedger = recentLedgers.find(l => l.clientId === client.id);
                        if (latestLedger && latestLedger.googleEventId) {
                            client.activeSessionName = eventMap.get(latestLedger.googleEventId) || "Unknown Session";
                        }
                    });
                } catch (e) {
                    console.error("Failed to fetch today events for live status", e);
                }
            }
        }

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
			with: {
				category: true,
				healthLogs: {
					orderBy: desc(healthLogs.startDate),
					where: isNull(healthLogs.endDate), // access active only?
					// Actually, for "Edit Client", we want ACTIVE logs to populate the form.
					// Resolved logs (history) shouldn't appear in the "Current Care" list unless we decided to show them elsewhere.
					// The requirement says: "If an item is removed... mark it as 'Resolved'...".
					// So form should only load Active logs.
				},
				wallets: {
					with: {
						product: true,
					},
					orderBy: desc(clientWallets.activatedAt),
				},
			},
		});

		if (!client) return { error: "Client not found" };

		// Filter for active wallet to pre-fill form
		const activeWallet = client.wallets.find((w) => w.status === "active");

		return {
			success: true,
			client: {
				...client,
				// Flatten active product for form consumption if needed,
				// or let client component handle it.
				activeProductId: activeWallet?.productId,
			},
		};
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
			// 1. Update Core Client Data
			const {
				healthLogs: _healthLogs, // renaming to underscore prefixed but not used in the next line is what caused problems before. wait. 
                // actually, I'll just remove them from destructuring if I don't need them.
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

			// 2. Handle Health Logs Sync
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
						// Update existing
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
						// Insert new
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

				// Resolve missing
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

		// 1. Fetch existing client to get resource name
		const existingClient = await db.query.clients.findFirst({
			where: eq(clients.id, id),
		});

		if (existingClient?.googleContactResourceName) {
			// 2. Sync to Google Contacts
			let accessToken: string;
			try {
				accessToken = await getValidAccessToken(user.id);

				// Fetch category name
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

				// Update photoUrl if we got one back
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
					// Contact gone, just update local
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
			} catch (e: unknown) {
				console.error("Failed to sync delete to Google Contacts:", e);
				const err = e as { message?: string };
				if (err.message === "REAUTH_REQUIRED") {
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
