// The notification on Ouarda's phone (and any browser she turned it on in)
// when a booking arrives, through the dashboard installed as an app.

import { requestPushPayload } from "@/lib/domain/requests/notice";
import { isPushServiceEndpoint } from "@/lib/utils/push";
import { db } from "@/services/database";
import { type BookingRequest, pushSubscriptions } from "@/services/database/schema";

import { eq } from "drizzle-orm";
import { sendNotification, WebPushError } from "web-push";

const DEFAULT_SUBJECT = "mailto:contact@jnaninyoga.com";

/** A subscription the push service no longer knows: the app was removed, or permission withdrawn. */
const isGone = (error: unknown) => error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410);

export async function sendRequestPush(request: BookingRequest): Promise<void> {
	const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
	const privateKey = process.env.VAPID_PRIVATE_KEY;
	if (!publicKey || !privateKey) throw new Error("Push not configured");

	// Only the browsers' push services are posted to, whatever got stored.
	const subscriptions = (await db.select().from(pushSubscriptions)).filter((s) => isPushServiceEndpoint(s.endpoint));
	if (!subscriptions.length) return;

	const payload = JSON.stringify(requestPushPayload(request));
	const vapidDetails = { subject: process.env.VAPID_SUBJECT || DEFAULT_SUBJECT, publicKey, privateKey };

	const results = await Promise.allSettled(
		subscriptions.map(async (subscription) => {
			try {
				await sendNotification(
					{ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
					payload,
					{ vapidDetails, TTL: 24 * 60 * 60, urgency: "high" },
				);
				await db.update(pushSubscriptions).set({ lastOkAt: new Date() }).where(eq(pushSubscriptions.id, subscription.id));
			} catch (error) {
				if (isGone(error)) {
					await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, subscription.id));
					return;
				}
				throw error;
			}
		}),
	);

	const failed = results.filter((result) => result.status === "rejected");
	if (failed.length === subscriptions.length) throw (failed[0] as PromiseRejectedResult).reason;
	for (const failure of failed) console.error("A phone notification wasn't delivered:", (failure as PromiseRejectedResult).reason);
}
