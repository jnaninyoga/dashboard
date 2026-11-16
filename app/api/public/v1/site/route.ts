import { logServerError } from "@/lib/errors/server";
import { loadSitePayload } from "@/lib/website/site-data";

/**
 * What the website (jnaninyoga.com) builds from: the class times and their
 * words, the cards it shows, and its events. Public by design: nothing in
 * it is private, and drafts, archived cards and anyone's details never are.
 */
export const dynamic = "force-dynamic";

export async function GET() {
	try {
		// Only builds read this, right after a save: a cached copy would build the site without it.
		return Response.json(await loadSitePayload(), { headers: { "Cache-Control": "no-store" } });
	} catch (error) {
		return Response.json({ error: "unavailable", ref: logServerError("Reading the website's data", error) }, { status: 500 });
	}
}
