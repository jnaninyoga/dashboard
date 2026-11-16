// The website's addresses: the only pages allowed to call the dashboard's
// public API from a visitor's browser.

/** The website's origins, from `WEBSITE_ORIGINS` ("https://jnaninyoga.com, https://jnaninyoga.pages.dev"). */
export function websiteOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
	return (env.WEBSITE_ORIGINS ?? "")
		.split(",")
		.map((origin) => origin.trim().replace(/\/$/, ""))
		.filter(Boolean);
}

/** The CORS answer for a request from `origin`, or null when it isn't the website. */
export function corsHeaders(origin: string | null, allowed: string[] = websiteOrigins()): Record<string, string> | null {
	if (!origin || !allowed.includes(origin)) return null;
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "content-type",
		"Access-Control-Max-Age": "86400",
		Vary: "Origin",
	};
}

/** The hostnames a Turnstile check may have been solved on ("jnaninyoga.com"). */
export function websiteHostnames(allowed: string[] = websiteOrigins()): string[] {
	return allowed.flatMap((origin) => {
		try {
			return [new URL(origin).hostname];
		} catch {
			return [];
		}
	});
}
