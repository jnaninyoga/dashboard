import { logServerError } from "@/lib/errors/server";
import { type BookingRequest } from "@/services/database/schema";

import { sendRequestEmail } from "./email";
import { sendRequestPush } from "./push";

/**
 * Tells Ouarda a booking arrived: an email to contact@ and a notification on
 * her phone, each on its own. The booking is already saved, so a channel
 * that fails is logged and never undoes it; the count in the dashboard is
 * the third way she sees it.
 */
export async function notifyNewRequest(
	request: BookingRequest,
	senders: { email: typeof sendRequestEmail; push: typeof sendRequestPush } = {
		email: sendRequestEmail,
		push: sendRequestPush,
	},
): Promise<void> {
	const [email, push] = await Promise.allSettled([senders.email(request), senders.push(request)]);
	if (email.status === "rejected") logServerError("Request email", email.reason);
	if (push.status === "rejected") logServerError("Request push", push.reason);
}
