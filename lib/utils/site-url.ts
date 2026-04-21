/**
 * Gets the base URL of the site.
 * In development, returns localhost:3000.
 * In production, uses NEXT_PUBLIC_SITE_URL.
 */
export async function getSiteUrl() {
	// If we are in development, always use localhost
	if (process.env.NODE_ENV !== "production") {
		return "http://localhost:3000";
	}

	// In production, prioritize the environment variable
	return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
}
