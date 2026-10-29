// Google access can fail in two very different ways, and only one of them
// needs her to sign in again. Kept out of the "use server" token service,
// which may only export async functions.

/** No stored token, or Google refused the refresh token: sign in again. */
export const REAUTH_REQUIRED = "REAUTH_REQUIRED";
/** Network, Google outage, rate limit or a database hiccup: try again later. */
export const GOOGLE_UNAVAILABLE = "GOOGLE_UNAVAILABLE";

export function needsReauth(error: unknown): boolean {
	return error instanceof Error && error.message === REAUTH_REQUIRED;
}

/** What to tell her when an action couldn't reach Google (Calendar, Contacts…). */
export function googleErrorMessage(error: unknown, service = "Google"): string {
	return needsReauth(error)
		? "Your Google connection has expired. Sign in again to reconnect."
		: `${service} isn't answering right now. Try again in a moment.`;
}
