"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { canTake } from "@/lib/domain/events/rules";
import { logServerError } from "@/lib/errors/server";
import { confirmedPeople, lockEvent } from "@/lib/events/store";
import { db } from "@/services/database";
import { bookingRequests } from "@/services/database/schema";

import { eq } from "drizzle-orm";

type Result = { success?: true; error?: string; ref?: string };

const STATUSES = ["new", "confirmed", "declined"] as const;
type RequestStatus = (typeof STATUSES)[number];

function refresh(id: string) {
	revalidatePath("/bookings");
	revalidatePath(`/bookings/${id}`);
	// The count in the sidebar, the bottom bar and on the home page.
	revalidatePath("/", "layout");
}

class Refused extends Error {}

/**
 * Confirms or declines a booking, or puts it back among the new ones.
 * Confirming one for an outdoor event takes its places: the event is locked
 * meanwhile, so two confirmations can't both take the last place.
 */
export async function setRequestStatusAction(id: string, status: RequestStatus): Promise<Result> {
	await requireUser();
	if (!STATUSES.includes(status)) return { error: "Pick new, confirmed or declined." };
	try {
		const eventId = await db.transaction(async (tx) => {
			const [request] = await tx.select().from(bookingRequests).where(eq(bookingRequests.id, id)).for("update");
			if (!request) throw new Refused("This request no longer exists.");
			if (status === "confirmed" && request.status !== "confirmed" && request.eventId) {
				const event = await lockEvent(tx, request.eventId);
				if (event) {
					if (event.status === "cancelled") throw new Refused("This event is cancelled.");
					const taken = await confirmedPeople(event.id, tx);
					if (!canTake(event.capacity, taken, request.partySize)) {
						throw new Refused(`Full: ${taken} of ${event.capacity} places confirmed. Raise the limit to add ${request.partySize === 1 ? "someone" : "this group"}.`);
					}
				}
			}
			await tx.update(bookingRequests).set({ status, statusChangedAt: new Date() }).where(eq(bookingRequests.id, id));
			return request.eventId;
		});
		refresh(id);
		if (eventId) revalidatePath(`/website/events/${eventId}`);
		return { success: true };
	} catch (error) {
		if (error instanceof Refused) return { error: error.message };
		return { error: "Couldn't change the request", ref: logServerError("Changing a request's status", error) };
	}
}

/**
 * Erases the person's details at their request: their name, phone and
 * message go for good; the request stays, so counts and history add up.
 */
export async function eraseRequestAction(id: string): Promise<Result> {
	await requireUser();
	try {
		const erased = await db
			.update(bookingRequests)
			.set({ name: "", phone: "", message: null, ipHash: null, clientId: null, erasedAt: new Date() })
			.where(eq(bookingRequests.id, id))
			.returning({ id: bookingRequests.id });
		if (!erased.length) return { error: "This request no longer exists." };
		refresh(id);
		return { success: true };
	} catch (error) {
		return { error: "Couldn't erase the details", ref: logServerError("Erasing a request's details", error) };
	}
}
