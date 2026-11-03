// Plain helpers, safe in server components. Phone formatting lives in
// ./phone, which loads react-phone-number-input: that package can't be
// evaluated on the server (it breaks any server component importing it).

/** WhatsApp chat link: wa.me wants the number as digits only ("+212 6…" → "2126…"). */
export function whatsappHref(phone: string): string {
	return `https://wa.me/${phone.replace(/\D/g, "")}`;
}
