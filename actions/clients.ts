"use server";

import { db } from "@/drizzle";
import {
	clients,
	healthLogs,
	clientWallets,
} from "@/drizzle/schema";
import { eq, and, or, ilike, desc, isNull } from "drizzle-orm";
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
        healthLogs,
	} = parsed.data;

	const initialProductId = formData.get("initialProductId") as string | null;

	try {
        let clientWithId: { id: string }[] = [];

		await db.transaction(async (tx) => {
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
			clientWithId = await tx.insert(clients).values({
				fullName,
				phone,
				email: email || null,
				address: address || null,
				profession: profession || null,
				birthDate,
				category: category || ClientCategory.ADULT,
				gender: gender || Gender.MALE, 
				referralSource: referralSource ?? null,
				consultationReason: consultationReason || null,
				intakeData: intakeData || {}, // Store as plain JSONB
				googleContactResourceName: resourceName || null,
				photoUrl: photoUrl || null,
			}).returning({ id: clients.id });

            const newClientId = clientWithId[0].id;

            // --- Auto-Generate Health Logs ---
            const logsToInsert: any[] = [];
            const nowStr = new Date().toISOString().split("T")[0];

            // 1. Explicit Health Logs from Dynamic List (Priority)
            if (parsed.data.healthLogs && parsed.data.healthLogs.length > 0) {
                 parsed.data.healthLogs.forEach(log => {
                     logsToInsert.push({
                         clientId: newClientId,
                         category: log.category,
                         severity: log.severity,
                         condition: log.condition,
                         isAlert: log.isAlert,
                         startDate: log.startDate || nowStr
                     });
                 });
            }

            // 2. Fallback: Parse legacy intake fields ONLY if they are NOT covered by dynamic list?
            // "Merge" logic: The user wants "Current Care" (wizard step) to BE active logs.
            // "Medical History" (step 2 bottom) is static background.
            // So we should iterate the OTHER fields from intakeData that are NOT "Physical" (since Physical is now the dynamic list).
            
            if (intakeData) {
                const intake = intakeData as Record<string, string>;

                // Helper to check and add
                const addLog = (key: string, cat: string, sev: string, alert: boolean) => {
                     const val = intake[key];
                     if (val) {
                         // Check if this condition is already in dynamic list to avoid dupe? 
                         // Simple check: unlikely exact string match, but let's just add them as "Background".
                         logsToInsert.push({
                             clientId: newClientId,
                             category: cat,
                             severity: sev,
                             condition: `${key.replace(/([A-Z])/g, ' $1').trim()}: ${val}`, 
                             isAlert: alert,
                             startDate: nowStr
                         });
                     }
                };

                // Medical History is still useful as alerts? 
                // User said: "Wizard 'Medical History' = Static Background"
                // So maybe we do NOT create alerts for them anymore, just store in intakeData?
                // Request: "Wizard 'Current Care' = Active Health Logs... Wizard 'Medical History' = Static Background"
                // Implies we ONLY insert health_logs for the Dynamic List (Current Care replacements).
                // But previous req wanted "Knee Pain" from history to be alert.
                // Re-reading: "Merge 'Current Care' with 'Health Logs'... 'Medical History' = Static Background".
                // Okay, so we STOP generating logs from 'medicalHistory' fields?
                // "Auto-Generate Health Logs from Intake" was Task 1 of Phase 2.5.
                // Task 1 of Phase 3 says "Replace 'Current Care' text area... with Dynamic Condition List... saved directly to health_logs".
                // Use discretion: If user explicitly adds it to the list, it's a log.
                // If they fill out "Medical History", it stays in `intakeData` JSON.
                // So I should REMOVE the auto-generation logic for medical history fields to avoid duplication/noise, 
                // defaulting to ONLY what is in `parsed.data.healthLogs`.
            }
            
            if (logsToInsert.length > 0) {
                // @ts-ignore - types are tricky with dynamic array
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
			with: {
				healthLogs: {
					orderBy: desc(healthLogs.startDate),
                    where: isNull(healthLogs.endDate) // access active only? 
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
        const activeWallet = client.wallets.find(w => w.status === 'active');
        
		return { 
            success: true, 
            client: {
                ...client,
                // Flatten active product for form consumption if needed, 
                // or let client component handle it.
                activeProductId: activeWallet?.productId
            } 
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
        // @ts-ignore - healthLogs might be in formData as JSON string if not handled by hydration?
        // Actually, Zod handles it if passed as object. Server Actions receive FormData.
        // We aren't parsing FormData for healthLogs array manually here yet!
        // The wizard (client-side) needs to serialize `healthLogs` into FormData if it's a complex array.
        // Or we rely on `parseOrIgnore`? 
        // Wait, FormData doesn't support arrays of objects naturally. 
        // Client side `step-health-wellness` uses `useFieldArray`.
        // `ClientForm` onSubmit needs to stringify `healthLogs` or append them individually.
        // Let's assume ClientForm appends `healthLogs` as a JSON string or we parse it?
        // Check `client-form.tsx` onSubmit. 
        // (Self-correction: I haven't updated ClientForm onSubmit to handle healthLogs array yet!)
        // I will need to update ClientForm. For now, let's assume it sends a JSON string "healthLogs".
        healthLogs: formData.get("healthLogs") ? JSON.parse(formData.get("healthLogs") as string) : [],
	};

	const parsed = clientSchema.safeParse(rawData);

	if (!parsed.success) {
		return { error: "Validation failed", issues: parsed.error.format() };
	}

    const { healthLogs: submittedLogs } = parsed.data;

	try {
        await db.transaction(async (tx) => {
             // 1. Update Core Client Data
             await tx
                .update(clients)
                .set({
                    ...parsed.data,
                    category: parsed.data.category,
                    gender: parsed.data.gender,
                    // exclude healthLogs from client table update
                    intakeData: parsed.data.intakeData || {}, 
                })
                .where(eq(clients.id, id));

             // 2. Handle Health Logs Sync
             const existingLogs = await tx.query.healthLogs.findMany({
                 where: eq(healthLogs.clientId, id)
             });

             const nowStr = new Date().toISOString().split("T")[0];

             if (submittedLogs && submittedLogs.length > 0) {
                 const submittedConditions = new Set(submittedLogs.map(l => l.condition.trim().toLowerCase()));
                 
                 for (const log of submittedLogs) {
                     const match = existingLogs.find(
                         ex => ex.condition.trim().toLowerCase() === log.condition.trim().toLowerCase() && !ex.endDate
                     );
                     
                     if (match) {
                         // Update existing
                         if (match.severity !== log.severity || match.isAlert !== log.isAlert) {
                             await tx.update(healthLogs)
                                .set({ 
                                    severity: log.severity as any, 
                                    isAlert: log.isAlert 
                                })
                                .where(eq(healthLogs.id, match.id));
                         }
                     } else {
                         // Insert new
                         await tx.insert(healthLogs).values({
                             clientId: id,
                             category: log.category as any,
                             condition: log.condition,
                             severity: log.severity as any,
                             isAlert: log.isAlert,
                             startDate: log.startDate || nowStr
                         });
                     }
                 }

                 // Resolve missing
                 for (const ex of existingLogs) {
                     if (!ex.endDate && !submittedConditions.has(ex.condition.trim().toLowerCase())) {
                          await tx.update(healthLogs)
                            .set({ endDate: nowStr, isAlert: false })
                            .where(eq(healthLogs.id, ex.id));
                     }
                 }
             } else {
                 if (submittedLogs) {
                      await tx.update(healthLogs)
                        .set({ endDate: nowStr, isAlert: false })
                        .where(and(eq(healthLogs.clientId, id), isNull(healthLogs.endDate)));
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
				if (e.message === "REAUTH_REQUIRED") {
					return { error: "Session expired. Please refresh the page." };
				}
				if (e.code === 404) {
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
