// Database work for the public booking endpoint. A plain server module, on
// purpose not "use server": its functions must not become endpoints anyone
// can call. Only the route handler and the dashboard's own actions use them.

import { phoneKey } from "@/lib/domain/requests/phone";
import { db } from "@/services/database";
import { type BookingRequest, bookingRequests, clients, type NewBookingRequest } from "@/services/database/schema";

import { and, count, eq, gte } from "drizzle-orm";

/** How many bookings this connection sent since `since`. */
export async function countRecentFromIp(ipHash: string, since: Date): Promise<number> {
	const [row] = await db
		.select({ count: count() })
		.from(bookingRequests)
		.where(and(eq(bookingRequests.ipHash, ipHash), gte(bookingRequests.createdAt, since)));
	return row?.count ?? 0;
}

/** The bookings received since `since`, to recognise one sent twice. */
export async function recentRequests(
	since: Date,
): Promise<Pick<BookingRequest, "id" | "ref" | "phone" | "name" | "choiceLabel" | "message" | "createdAt">[]> {
	return db
		.select({
			id: bookingRequests.id,
			ref: bookingRequests.ref,
			phone: bookingRequests.phone,
			name: bookingRequests.name,
			choiceLabel: bookingRequests.choiceLabel,
			message: bookingRequests.message,
			createdAt: bookingRequests.createdAt,
		})
		.from(bookingRequests)
		.where(gte(bookingRequests.createdAt, since));
}

/**
 * The client with this phone, however either was written. Her client list
 * is small (hundreds), so the phones are compared here rather than in SQL.
 */
export async function matchClientId(phone: string): Promise<string | null> {
	const key = phoneKey(phone);
	if (!key) return null;
	const rows = await db.select({ id: clients.id, phone: clients.phone }).from(clients);
	return rows.find((client) => phoneKey(client.phone) === key)?.id ?? null;
}

export async function saveRequest(row: NewBookingRequest): Promise<BookingRequest> {
	const [saved] = await db.insert(bookingRequests).values(row).returning();
	return saved;
}
