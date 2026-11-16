// Plain words about a request, for server and client components alike (a
// server component can't call a function exported from a "use client" file).

import { toE164 } from "@/lib/domain/requests/phone";
import { contactOf, whatsappReply } from "@/lib/domain/requests/reply";
import { whatsappHref } from "@/lib/utils/contact";
import { type BookingRequest } from "@/services/database/schema";

/** Who the request is from, or that their details were erased. */
export function requestTitle(request: Pick<BookingRequest, "name" | "erasedAt">): string {
	return request.erasedAt ? "Details erased" : request.name;
}

/** WhatsApp with her first message already written, in the visitor's language; null once their details are erased. */
export function replyHref(
	request: Pick<BookingRequest, "name" | "phone" | "erasedAt" | "lang" | "kind" | "choiceLabel">,
): string | null {
	const contact = contactOf(request);
	if (!contact) return null;
	return `${whatsappHref(toE164(contact.phone) ?? contact.phone)}?text=${encodeURIComponent(whatsappReply(request))}`;
}
