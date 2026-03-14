import { headers } from "next/headers";

/**
 * Gets the base URL of the site.
 * Prioritizes NEXT_PUBLIC_SITE_URL from environment variables.
 * Falls back to dynamic detection from headers if needed.
 */
export async function getSiteUrl() {
	// Prioritize the environment variable if defined and not empty
	if (process.env.NEXT_PUBLIC_SITE_URL) {
		return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
	}

	// Dynamic detection from headers
	const headersList = await headers();
	const forwardedHost = headersList.get("x-forwarded-host");
	const host = headersList.get("host");
	const finalHost = forwardedHost || host;

	if (finalHost) {
		const protocol = headersList.get("x-forwarded-proto") || 
			(finalHost.includes("localhost") ? "http" : "https");
		return `${protocol}://${finalHost}`;
	}

	// Vercel deployment fallback
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`;
	}

	// Final local fallback
	return "http://localhost:3000";
}
