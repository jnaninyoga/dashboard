import { formatPhoneNumberIntl } from "react-phone-number-input";

/** WhatsApp chat link: wa.me wants the number as digits only ("+212 6…" → "2126…"). */
export function whatsappHref(phone: string): string {
	return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

/** A phone number grouped for reading ("+212 6 61 23 45 67"); as typed if it can't be parsed. */
export function formatPhone(phone: string): string {
	return formatPhoneNumberIntl(phone) || phone;
}
