import { logServerError } from "@/lib/errors/server";
import { placesBySlug } from "@/lib/events/store";
import { corsHeaders } from "@/lib/website/origins";

/**
 * Places left on the website's events, read live by the visitor's browser
 * (`?slugs=a,b`): the site is built in advance, but places change by the
 * minute. Only published events answer.
 */
export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
	const cors = corsHeaders(request.headers.get("origin"));
	return cors ? new Response(null, { status: 204, headers: { ...cors, "Access-Control-Allow-Methods": "GET, OPTIONS" } }) : new Response(null, { status: 403 });
}

export async function GET(request: Request) {
	const cors = corsHeaders(request.headers.get("origin")) ?? {};
	const slugs = (new URL(request.url).searchParams.get("slugs") ?? "")
		.split(",")
		.map((s) => s.trim())
		.filter((s) => /^[a-z0-9-]{1,80}$/.test(s))
		.slice(0, 20);
	try {
		return Response.json(await placesBySlug(slugs), {
			headers: { ...cors, "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
		});
	} catch (error) {
		return Response.json({ error: "unavailable", ref: logServerError("Reading event places", error) }, { status: 500, headers: cors });
	}
}
