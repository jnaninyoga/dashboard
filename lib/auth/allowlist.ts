type AccessUser = { email: string; emailVerified: boolean };

/** The `?error=` the login page shows as "this account doesn't have access". */
export const NOT_ALLOWED = "NOT_ALLOWED";

/**
 * Whether this person is on the list of emails (comma separated). An empty
 * or missing list lets nobody in, and only an address Google has verified
 * counts: anyone can type someone else's email into a new Google account.
 */
export function isAllowedUser(user: AccessUser, list: string | undefined): boolean {
	if (!user.emailVerified) return false;
	const email = user.email.trim().toLowerCase();
	if (!email) return false;
	return (list ?? "").split(",").some((entry) => entry.trim().toLowerCase() === email);
}

/** Whether this person may use this deployment of the dashboard. */
export function hasAccess(user: AccessUser): boolean {
	return isAllowedUser(user, process.env.AUTH_ALLOWED_EMAILS);
}
