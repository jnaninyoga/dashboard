"use server";

import { requireUser } from "@/lib/auth/require-user";
import { creditsSummary } from "@/lib/domain/clients/card";
import { phoneKey } from "@/lib/domain/requests/phone";
import { receivedLabel } from "@/lib/domain/requests/received";
import { logServerError } from "@/lib/errors/server";
import { db } from "@/services/database";
import { type BookingRequest, bookingRequests, clients, clientWallets } from "@/services/database/schema";

import { count, desc, eq, inArray, ne, sql } from "drizzle-orm";

export type RequestClient = { id: string; fullName: string; credits: ReturnType<typeof creditsSummary> };

/**
 * A request with the client it's from (the one it was matched to, or, until
 * then, one with the same phone) and when it arrived in words. The words are
 * made once, on the server, with the studio time helpers: worked out again in
 * the browser, a phone whose time-zone data differs from the server's would
 * show another hour and break hydration.
 */
export type RequestView = BookingRequest & { client: RequestClient | null; received: string };

/**
 * Finds each request's client. A client added after the request arrived is
 * still found by phone; an erased request has no client.
 */
async function withClients(rows: BookingRequest[]): Promise<RequestView[]> {
	if (!rows.length) return [];
	const now = new Date();
	const everyone = await db.select({ id: clients.id, phone: clients.phone }).from(clients);
	const byPhone = new Map<string, string>();
	for (const client of everyone) {
		const key = phoneKey(client.phone);
		if (key && !byPhone.has(key)) byPhone.set(key, client.id);
	}

	const clientIdOf = (row: BookingRequest) => {
		if (row.erasedAt) return null;
		if (row.clientId) return row.clientId;
		const key = phoneKey(row.phone);
		return key ? (byPhone.get(key) ?? null) : null;
	};

	const ids = [...new Set(rows.map(clientIdOf).filter((id): id is string => !!id))];
	const matched = ids.length
		? await db.query.clients.findMany({
				where: inArray(clients.id, ids),
				columns: { id: true, fullName: true },
				with: { wallets: { where: ne(clientWallets.status, "cancelled"), with: { product: true } } },
			})
		: [];
	const byId = new Map(
		matched.map((client) => [
			client.id,
			{ id: client.id, fullName: client.fullName, credits: creditsSummary(client.wallets) } satisfies RequestClient,
		]),
	);

	return rows.map((row) => {
		const id = clientIdOf(row);
		return { ...row, client: id ? (byId.get(id) ?? null) : null, received: receivedLabel(row.createdAt, now) };
	});
}

/** Her requests: new ones first, then the ones she handled, each newest first. */
export async function getRequests(
	opts: { status?: "new"; limit?: number } = {},
): Promise<{ data?: RequestView[]; error?: string; ref?: string }> {
	await requireUser();
	try {
		const query = db
			.select()
			.from(bookingRequests)
			.where(opts.status ? eq(bookingRequests.status, opts.status) : undefined)
			.orderBy(sql`case when ${bookingRequests.status} = 'new' then 0 else 1 end`, desc(bookingRequests.createdAt));
		const rows = opts.limit ? await query.limit(opts.limit) : await query;
		return { data: await withClients(rows) };
	} catch (error) {
		return { error: "Couldn't load the requests", ref: logServerError("Loading requests", error) };
	}
}

export async function getRequest(id: string): Promise<{ data?: RequestView | null; error?: string; ref?: string }> {
	await requireUser();
	if (!/^[0-9a-f-]{36}$/i.test(id)) return { data: null };
	try {
		const rows = await db.select().from(bookingRequests).where(eq(bookingRequests.id, id)).limit(1);
		const [view] = await withClients(rows);
		return { data: view ?? null };
	} catch (error) {
		return { error: "Couldn't load this request", ref: logServerError("Loading a request", error) };
	}
}

/** How many requests wait for her answer. Zero when it can't be read: the page itself shows the problem. */
export async function getNewRequestCount(): Promise<number> {
	await requireUser();
	try {
		const [row] = await db
			.select({ count: count() })
			.from(bookingRequests)
			.where(eq(bookingRequests.status, "new"));
		return row?.count ?? 0;
	} catch (error) {
		logServerError("Counting new requests", error);
		return 0;
	}
}
