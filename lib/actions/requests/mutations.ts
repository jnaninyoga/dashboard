"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { logServerError } from "@/lib/errors/server";
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

/** Confirms or declines a request, or puts it back among the new ones. */
export async function setRequestStatusAction(id: string, status: RequestStatus): Promise<Result> {
	await requireUser();
	if (!STATUSES.includes(status)) return { error: "Pick new, confirmed or declined." };
	try {
		const changed = await db
			.update(bookingRequests)
			.set({ status, statusChangedAt: new Date() })
			.where(eq(bookingRequests.id, id))
			.returning({ id: bookingRequests.id });
		if (!changed.length) return { error: "This request no longer exists." };
		refresh(id);
		return { success: true };
	} catch (error) {
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
