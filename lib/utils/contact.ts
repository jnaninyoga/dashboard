/** WhatsApp chat link: wa.me wants the number as digits only ("+212 6…" → "2126…"). */
export function whatsappHref(phone: string): string {
	return `https://wa.me/${phone.replace(/\D/g, "")}`;
}
