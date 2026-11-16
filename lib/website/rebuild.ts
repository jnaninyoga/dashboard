// Rebuilding the website after a change it shows. The site is static: it
// reads the dashboard while it builds, so a new price or class time reaches
// it through Cloudflare's deploy hook, live about two minutes later.

import { logServerError } from "@/lib/errors/server";

export type RebuildOutcome = "requested" | "not_configured" | "failed";

/** Asks Cloudflare Pages to rebuild the site. Never throws: the change is already saved. */
export async function requestSiteRebuild(reason: string, fetchImpl: typeof fetch = fetch): Promise<RebuildOutcome> {
	const hook = process.env.SITE_DEPLOY_HOOK_URL;
	if (!hook) return "not_configured";
	try {
		const res = await fetchImpl(hook, { method: "POST", signal: AbortSignal.timeout(10_000) });
		if (res.ok) return "requested";
		logServerError(`Rebuilding the website (${reason})`, new Error(`Deploy hook answered ${res.status}`));
	} catch (error) {
		logServerError(`Rebuilding the website (${reason})`, error);
	}
	return "failed";
}
