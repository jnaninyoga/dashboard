// How Ouarda answers a request, and whether she still can.

import type { RequestKind, SiteLang } from "./submission";

export type RequestContact = { name: string; phone: string };

/** Who to answer, or null once their details were erased at their request. */
export function contactOf(request: { name: string; phone: string; erasedAt: Date | null }): RequestContact | null {
	if (request.erasedAt || !request.phone) return null;
	return { name: request.name, phone: request.phone };
}

/**
 * The first WhatsApp message, already written, in the language the visitor
 * used on the website. An open request ("not sure yet") has no choice to
 * name.
 */
export function whatsappReply(request: { name: string; lang: SiteLang; kind: RequestKind; choiceLabel: string }): string {
	const firstName = request.name.trim().split(/\s+/)[0] ?? "";
	const choice = request.kind === "other" ? "" : ` (${request.choiceLabel})`;
	return request.lang === "en"
		? `Hello ${firstName}, this is Ouarda from jnaninyoga. Thank you for your request${choice}.`
		: `Bonjour ${firstName}, c'est Ouarda de jnaninyoga. Merci pour votre demande${choice}.`;
}
