import { requestSiteRebuild } from "@/lib/website/rebuild";

/**
 * Vercel's daily cron rebuilds the website, so events that have ended leave
 * its pages even when nothing was saved. Only Vercel knows the secret.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	const secret = process.env.CRON_SECRET;
	if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}
	return Response.json({ rebuild: await requestSiteRebuild("daily") });
}
