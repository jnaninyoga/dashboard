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
		return Response.json(await loadSitePayload(), {
			headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
		});
	} catch (error) {
		return Response.json({ error: "unavailable", ref: logServerError("Reading the website's data", error) }, { status: 500 });
	}
}
