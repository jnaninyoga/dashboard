"use server";

import { requireUser } from "@/lib/auth/require-user";
import { logServerError } from "@/lib/errors/server";
import { db } from "@/services/database";
import { pushSubscriptions } from "@/services/database/schema";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

const subscriptionSchema = z.object({
	endpoint: z.url(),
	keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

type Result = { success?: true; error?: string; ref?: string };

/** Remembers this phone (or browser), so new bookings reach it. */
export async function savePushSubscriptionAction(subscription: unknown): Promise<Result> {
	const user = await requireUser();
	const parsed = subscriptionSchema.safeParse(subscription);
	if (!parsed.success) return { error: "This browser gave an unusable subscription. Try again." };
	const { endpoint, keys } = parsed.data;
	try {
		await db
			.insert(pushSubscriptions)
			.values({ userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth })
			.onConflictDoUpdate({
				target: pushSubscriptions.endpoint,
				set: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth },
			});
		return { success: true };
	} catch (error) {
		return { error: "Couldn't turn notifications on", ref: logServerError("Saving a push subscription", error) };
	}
}

/** Forgets this phone (or browser): no more booking notifications on it. */
export async function removePushSubscriptionAction(endpoint: string): Promise<Result> {
	const user = await requireUser();
	try {
		await db
			.delete(pushSubscriptions)
			.where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, user.id)));
		return { success: true };
	} catch (error) {
		return { error: "Couldn't turn notifications off", ref: logServerError("Removing a push subscription", error) };
	}
}
