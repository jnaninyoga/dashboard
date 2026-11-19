import { logServerError } from "@/lib/errors/server";
import { syncUpcomingOutdoorSessions } from "@/lib/events/calendar-sync";
import { requestSiteRebuild } from "@/lib/website/rebuild";

/**
 * Vercel's daily cron rebuilds the website, so events that have ended leave
 * its pages even when nothing was saved. First, upcoming outdoor sessions
 * moved or renamed in Google Calendar follow it, so the site shows their new
 * day. Only Vercel knows the secret.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	const secret = process.env.CRON_SECRET;
	if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}
	// A failed pass never stops the rebuild: the pages she opens follow her calendar too.
	const followed = await syncUpcomingOutdoorSessions().catch((error) => {
		logServerError("Following Google Calendar before the daily rebuild", error);
		return null;
	});
	return Response.json({ followed, rebuild: await requestSiteRebuild("daily") });
}
