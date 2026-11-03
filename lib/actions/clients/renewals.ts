"use server";

import { requireUser } from "@/lib/auth/require-user";
import { LOW_CREDITS } from "@/lib/domain/clients/card";
import { byUrgency, LAPSED_WITHIN_DAYS, RENEW_WITHIN_DAYS,type Renewal, renewalFor } from "@/lib/domain/clients/renewal";
import { logServerError } from "@/lib/errors/server";
import { type Client } from "@/lib/types";
import { addDays, fromStudioTime, studioDateString } from "@/lib/utils/time";
import { db } from "@/services/database";
import { clients, clientWallets } from "@/services/database/schema";

import { and, between, gte, inArray, isNull, lte, ne, or } from "drizzle-orm";

export type RenewalDue = { client: Client; renewal: Renewal };

/**
 * The clients to ask about a new card today, the most pressing first:
 * their card ends this week, two or fewer credits are left, or their last
 * card ended or ran out this past month (the rules are `renewalFor`).
 */
export async function getRenewalsDue(): Promise<{ data?: RenewalDue[]; error?: string; ref?: string }> {
	await requireUser();
	try {
		const today = studioDateString();
		const since = addDays(today, -LAPSED_WITHIN_DAYS);
		const sinceStart = fromStudioTime(since, "00:00");
		// Narrow to clients with a card near one of those lines; the rule then
		// reads all their cards (another card may keep them going).
		const candidates = await db
			.selectDistinct({ id: clientWallets.clientId })
			.from(clientWallets)
			.where(
				and(
					ne(clientWallets.status, "cancelled"),
					or(
						between(clientWallets.expiresOn, since, addDays(today, RENEW_WITHIN_DAYS)),
						and(
							lte(clientWallets.remainingCredits, LOW_CREDITS),
							or(gte(clientWallets.lastUsedAt, sinceStart), and(isNull(clientWallets.lastUsedAt), gte(clientWallets.activatedAt, sinceStart))),
						),
					),
				),
			);
		if (!candidates.length) return { data: [] };

		const rows = await db.query.clients.findMany({
			where: inArray(clients.id, candidates.map((c) => c.id)),
			with: { wallets: { where: ne(clientWallets.status, "cancelled"), with: { product: { columns: { name: true } } } } },
		});
		const data = rows
			.flatMap(({ wallets, ...client }) => {
				const renewal = renewalFor(wallets, today);
				return renewal ? [{ client, renewal }] : [];
			})
			.sort((a, b) => byUrgency(a.renewal, b.renewal) || a.client.fullName.localeCompare(b.client.fullName));
		return { data };
	} catch (error) {
		return { error: "Couldn't load the cards to renew", ref: logServerError("Loading renewals", error) };
	}
}
