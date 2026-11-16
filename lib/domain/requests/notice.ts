// What Ouarda receives when a booking arrives: the email to contact@, and
// the notification on her phone. French, like the email the website sent.

import { type BookingRequest } from "@/services/database/schema";

import { messageExcerpt } from "./choice";
import { phoneKey } from "./phone";

type NoticeRequest = Pick<BookingRequest, "id" | "ref" | "name" | "phone" | "choiceLabel" | "message" | "lang">;

const escapeHtml = (value: string) =>
	value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

const LANGS = { fr: "Français", en: "Anglais" } as const;

/** The email to contact@: who, what, their message, and the two ways to answer. */
export function requestEmail(request: NoticeRequest, dashboardUrl: string): { subject: string; text: string; html: string } {
	const link = `${dashboardUrl.replace(/\/$/, "")}/bookings/${request.id}`;
	// WhatsApp needs the country code: a national "06…" number wouldn't open.
	const whatsapp = `https://wa.me/${phoneKey(request.phone) ?? request.phone.replace(/\D/g, "")}`;
	const lang = LANGS[request.lang];

	const text = [
		`Nom : ${request.name}`,
		`Téléphone : ${request.phone}`,
		`Demande : ${request.choiceLabel}`,
		`Langue : ${lang}`,
		"",
		request.message ?? "",
		"",
		`Répondre sur WhatsApp : ${whatsapp}`,
		`Ouvrir dans le tableau de bord : ${link}`,
		"",
		request.ref ?? "",
	].join("\n");

	const row = (key: string, value: string) =>
		`<tr><td style="padding:6px 16px 6px 0;color:#0c3b42;opacity:.7">${key}</td><td style="padding:6px 0;color:#0c3b42">${escapeHtml(value)}</td></tr>`;
	const message = request.message
		? `<p style="white-space:pre-line;font-size:16px;line-height:1.5;color:#0c3b42;background:#f4c8bd;padding:16px;border-radius:6px">${escapeHtml(request.message)}</p>`
		: "";
	const html = `<!doctype html><meta name="color-scheme" content="light only"><body style="margin:0;background:#fbe6e0;font-family:Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:32px 24px"><h1 style="font-family:Georgia,serif;font-weight:400;font-size:30px;color:#0c3b42;margin:0 0 16px">Nouvelle demande de ${escapeHtml(request.name)}</h1><table style="border-collapse:collapse;font-size:16px">${row("Téléphone", request.phone)}${row("Demande", request.choiceLabel)}${row("Langue", lang)}</table>${message}<p><a href="${escapeHtml(whatsapp)}" style="display:inline-block;background:#0c3b42;color:#fbe6e0;padding:12px 22px;border-radius:999px;text-decoration:none">Répondre sur WhatsApp</a></p><p><a href="${escapeHtml(link)}" style="color:#0c3b42">Ouvrir dans le tableau de bord</a></p><p style="font-size:13px;color:#0c3b42;opacity:.7">${escapeHtml(request.ref ?? "")}</p></div></body>`;

	return { subject: `Website: Réservation de ${request.name}`, text, html };
}

/** The phone notification: the name, then what they want and the start of their message. Tapping opens the request. */
export function requestPushPayload(request: Pick<BookingRequest, "id" | "name" | "choiceLabel" | "message">): {
	title: string;
	body: string;
	url: string;
	tag: string;
} {
	const excerpt = messageExcerpt(request.message);
	return {
		title: request.name,
		body: excerpt ? `${request.choiceLabel} · ${excerpt}` : request.choiceLabel,
		url: `/bookings/${request.id}`,
		tag: request.id,
	};
}
