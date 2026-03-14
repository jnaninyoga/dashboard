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

	if (finalHost && !finalHost.includes("localhost:8080") && !finalHost.includes("127.0.0.1")) {
		const protocol = headersList.get("x-forwarded-proto") || "https";
		return `${protocol}://${finalHost}`;
	}

	// Railway specific environment variable (if set)
	if (process.env.RAILWAY_PUBLIC_DOMAIN) {
		return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
	}

	// Vercel deployment fallback
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`;
	}

	// Final local fallback
	return "http://localhost:3000";
}
