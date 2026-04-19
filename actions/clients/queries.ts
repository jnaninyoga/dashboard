"use server";

import { db } from "@/drizzle";
import {
	attendanceLedger,
	clients,
	clientWallets,
	healthLogs,
} from "@/drizzle/schema";
import { type Client, type ClientWithRelations, Gender } from "@/lib/types";
import { getTodayEvents } from "@/services/google-calendar";
import { getValidAccessToken } from "@/services/google-tokens";
import { createClient } from "@/supabase/server";

import { and, desc, eq, gte, ilike, inArray, isNull, or } from "drizzle-orm";

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

		const data = (await db.query.clients.findMany({
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
		})) as ClientWithRelations[];


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
		const client = (await db.query.clients.findFirst({
			where: eq(clients.id, id),
			with: {
				category: true,
				healthLogs: {
					orderBy: desc(healthLogs.startDate),
					where: isNull(healthLogs.endDate), // active only
				},
				wallets: {
					with: {
						product: true,
					},
					orderBy: desc(clientWallets.activatedAt),
				},
			},
		})) as ClientWithRelations | null;


		if (!client) return { error: "Client not found" };

		// Filter for active wallet to pre-fill form
		const activeWallet = client.wallets?.find((w) => w.status === "active");


		return {
			success: true,
			client: {
				...client,
				activeProductId: activeWallet?.productId,
			},
		};
	} catch (error) {
		console.error("Error fetching client:", error);
		return { error: "Failed to fetch client" };
	}
}
