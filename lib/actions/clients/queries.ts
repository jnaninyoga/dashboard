"use server";

import { requireUser } from "@/lib/auth/require-user";
import { logServerError } from "@/lib/errors/server";
import { type Client, type ClientWithRelations, Gender } from "@/lib/types";
import { studioDayStart, studioMonthStart } from "@/lib/utils/time";
import { db } from "@/services/database";
import {
	attendanceLedger,
	clients,
	clientWallets,
	healthLogs,
	products,
	studioSessions,
} from "@/services/database/schema";
import { getTodayEvents } from "@/services/google";
import { getValidAccessToken } from "@/services/google";

import { and, desc, eq, gte, ilike, inArray, isNull, ne, or, sql } from "drizzle-orm";

export async function getClientsAction(
	page = 1,
	pageSize = 10,
	query = "",
	filters: { discountId?: string; gender?: Gender } = {},
) {
	const user = await requireUser();

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

	if (filters.discountId && filters.discountId !== "all") {
		whereConditions.push(eq(clients.discountId, filters.discountId));
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
				discount: true,
				// Every card sold (an expired or used-up one too, to say so on the card).
				wallets: {
					where: ne(clientWallets.status, "cancelled"),
					with: { product: true },
					orderBy: desc(clientWallets.activatedAt),
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
        // The studio's day and month, not the server's (which runs on UTC).
        const startOfToday = studioDayStart();
        const startOfMonth = studioMonthStart();

        if (data.length > 0) {
            const clientIds = data.map(c => c.id);

            // Visits this month and the last visit, across all of a client's cards.
            const visits = await db
                .select({
                    clientId: clientWallets.clientId,
                    // gte() converts the date the way the column expects; a bare Date in raw SQL fails.
                    thisMonth: sql<number>`count(*) filter (where ${gte(attendanceLedger.checkInTime, startOfMonth)})`.mapWith(Number),
                    // Mapped through the column, so the raw timestamp becomes the same Date a normal select gives.
                    lastVisitAt: sql<Date>`max(${attendanceLedger.checkInTime})`.mapWith(attendanceLedger.checkInTime),
                })
                .from(attendanceLedger)
                .innerJoin(clientWallets, eq(attendanceLedger.walletId, clientWallets.id))
                // Check-ins of cancelled sessions aren't visits.
                .where(and(inArray(clientWallets.clientId, clientIds), isNull(attendanceLedger.cancelledAt)))
                .groupBy(clientWallets.clientId);
            const visitsByClient = new Map(visits.map((v) => [v.clientId, v]));
            for (const client of data as (Client & { visitsThisMonth?: number; lastVisitAt?: Date })[]) {
                const v = visitsByClient.get(client.id);
                client.visitsThisMonth = v?.thisMonth ?? 0;
                client.lastVisitAt = v?.lastVisitAt ?? undefined;
            }

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
                        gte(attendanceLedger.checkInTime, startOfToday),
                        isNull(attendanceLedger.cancelledAt)
                    )
                )
                .orderBy(desc(attendanceLedger.checkInTime));

            // Checked in today is a fact in our records; Google only adds the
            // session's name, and the badge says "Checked in" without it.
            const clientsToday = data as (Client & { checkedInToday?: boolean; activeSessionName?: string })[];
            for (const client of clientsToday) {
                client.checkedInToday = recentLedgers.some((l) => l.clientId === client.id);
            }

            if (recentLedgers.length > 0 && accessToken) {
                try {
                    const todayEvents = await getTodayEvents(accessToken);
                    const eventMap = new Map(todayEvents.map(e => [e.id, e.summary]));

                    for (const client of clientsToday) {
                        const latestLedger = recentLedgers.find(l => l.clientId === client.id);
                        if (latestLedger?.googleEventId) {
                            client.activeSessionName = eventMap.get(latestLedger.googleEventId) ?? undefined;
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch today events for live status", e);
                }
            }
        }

		return { success: true, data };
	} catch (error) {
		return { error: "Failed to fetch clients", ref: logServerError("Error fetching clients", error) };
	}
}

export async function getClientByIdAction(id: string) {
	await requireUser();

	try {
		const client = (await db.query.clients.findFirst({
			where: eq(clients.id, id),
			with: {
				discount: true,
				healthLogs: {
					orderBy: desc(healthLogs.startDate),
					where: isNull(healthLogs.endDate), // active only
				},
				wallets: {
					with: {
						product: true,
						// The visits each card paid for (outdoor sessions take no credit).
						ledgerEntries: {
							columns: { id: true },
							where: and(isNull(attendanceLedger.cancelledAt), ne(attendanceLedger.slotType, "outdoor")),
						},
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
		return { error: "Failed to fetch client", ref: logServerError("Error fetching client", error) };
	}
}

/**
 * Batch-resolves a list of emails against the clients table.
 * Used by the outdoor event guest stack to identify which Google Calendar
 * attendees are also registered clients (photo + ring highlight).
 */
export async function getClientsByEmailsAction(
	emails: string[],
): Promise<{ email: string; clientId: string; fullName: string; photoUrl: string | null; phone: string | null }[]> {
	await requireUser();
	if (emails.length === 0) return [];

	try {
		const rows = await db
			.select({
				email: clients.email,
				clientId: clients.id,
				fullName: clients.fullName,
				photoUrl: clients.photoUrl,
				phone: clients.phone,
			})
			.from(clients)
			.where(inArray(clients.email, emails));

		return rows.filter((r) => r.email !== null) as {
			email: string;
			clientId: string;
			fullName: string;
			photoUrl: string | null;
			phone: string | null;
		}[];
	} catch (error) {
		console.error("Error fetching clients by emails:", error);
		return [];
	}
}

/** All of a client's health notes, resolved ones too (the profile's history). */
export async function getClientHealthNotes(clientId: string) {
	await requireUser();
	return db.select().from(healthLogs).where(eq(healthLogs.clientId, clientId)).orderBy(desc(healthLogs.startDate));
}

export type ClientVisit = {
	id: string;
	checkInTime: Date;
	slotType: "group" | "private" | "outdoor" | "b2b";
	/** The session was cancelled: kept in history, the credit went back. */
	cancelledAt: Date | null;
	googleEventId: string | null;
	/** The session's name, when the dashboard created it. */
	sessionTitle: string | null;
	/** The card that paid (outdoor sessions take no credit). */
	cardName: string | null;
};

/** A client's check-ins, the latest first, with the session and the card that paid. */
export async function getClientVisits(clientId: string, limit = 100): Promise<ClientVisit[]> {
	await requireUser();
	return db
		.select({
			id: attendanceLedger.id,
			checkInTime: attendanceLedger.checkInTime,
			slotType: attendanceLedger.slotType,
			cancelledAt: attendanceLedger.cancelledAt,
			googleEventId: attendanceLedger.googleEventId,
			sessionTitle: studioSessions.title,
			cardName: products.name,
		})
		.from(attendanceLedger)
		.innerJoin(clientWallets, eq(attendanceLedger.walletId, clientWallets.id))
		.leftJoin(studioSessions, eq(studioSessions.googleEventId, attendanceLedger.googleEventId))
		.leftJoin(products, eq(products.id, clientWallets.productId))
		.where(eq(clientWallets.clientId, clientId))
		.orderBy(desc(attendanceLedger.checkInTime))
		.limit(limit);
}
