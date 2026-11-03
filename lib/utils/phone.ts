// Client components only: react-phone-number-input can't be evaluated on the
// server. Plain contact helpers are in ./contact.
import { formatPhoneNumberIntl } from "react-phone-number-input";

/** A phone number grouped for reading ("+212 6 61 23 45 67"); as typed if it can't be parsed. */
export function formatPhone(phone: string): string {
	return formatPhoneNumberIntl(phone) || phone;
}
