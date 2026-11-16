// Phones as people type them on the website ("06 61 28 64 64",
// "+212 (0)6 61…", "00212…") and as the dashboard stores them (E.164),
// brought to one key so the same person is recognised either way.

/** Moroccan numbers have 9 digits after the country code. */
const MOROCCO = "212";

/**
 * The phone's digits with its country code, the way WhatsApp wants them
 * ("212661286464"), or null when there are too few digits to be a phone.
 * A national Moroccan number ("06…") gets the country code; the "(0)" some
 * people keep after it is dropped.
 */
export function phoneKey(phone: string): string | null {
	let digits = phone.replace(/\D/g, "");
	if (digits.startsWith("00")) digits = digits.slice(2);
	if (/^0\d{9}$/.test(digits)) digits = MOROCCO + digits.slice(1);
	if (/^2120\d{9}$/.test(digits)) digits = MOROCCO + digits.slice(4);
	return digits.length >= 8 ? digits : null;
}

/** The phone as the client form's phone field wants it ("+212661286464"). */
export function toE164(phone: string): string | undefined {
	const key = phoneKey(phone);
	return key ? `+${key}` : undefined;
}
