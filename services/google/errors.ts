// Google access can fail in two very different ways, and only one of them
// needs her to sign in again. Anything else (the database, a bug) is not
// Google's doing and must not be reported as if it were.

/** No stored token, or Google refused the refresh token: sign in again. */
export const REAUTH_REQUIRED = "REAUTH_REQUIRED";
/** Network, Google outage or rate limit: try again later. */
export const GOOGLE_UNAVAILABLE = "GOOGLE_UNAVAILABLE";

export function needsReauth(error: unknown): boolean {
	return error instanceof Error && error.message === REAUTH_REQUIRED;
}

/** A failure on Google's side of the connection (as opposed to ours). */
export function isGoogleAccessError(error: unknown): boolean {
	return error instanceof Error && (error.message === REAUTH_REQUIRED || error.message === GOOGLE_UNAVAILABLE);
}

/**
 * Why a token refresh failed. Only a refused refresh token (revoked, or
 * expired after 7 days while the Google app is in testing) needs a new
 * sign-in; a bad request, our own credentials or an outage do not.
 */
export function classifyRefreshFailure(status: number, body: string): typeof REAUTH_REQUIRED | typeof GOOGLE_UNAVAILABLE {
	return (status === 400 || status === 401) && body.includes("invalid_grant") ? REAUTH_REQUIRED : GOOGLE_UNAVAILABLE;
}

/** What to tell her when an action couldn't reach Google (Calendar, Contacts…). */
export function googleErrorMessage(error: unknown, service = "Google"): string {
	return needsReauth(error)
		? "Your Google connection has expired. Sign in again to reconnect."
		: `${service} isn't answering right now. Try again in a moment.`;
}
