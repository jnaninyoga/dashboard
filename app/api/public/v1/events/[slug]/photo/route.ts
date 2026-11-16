import { logServerError } from "@/lib/errors/server";
import { publicPhotoBySlug } from "@/lib/events/store";

/** An event's photo, for its page and social card on the website. Drafts have none here. */
export const dynamic = "force-dynamic";

const notFound = () => new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
	const { slug } = await ctx.params;
	if (!/^[a-z0-9-]{1,80}$/.test(slug)) return notFound();
	try {
		const photo = await publicPhotoBySlug(slug);
		if (!photo) return notFound();
		// The site asks with ?v=<when it changed>. That exact version can be cached for good; any other
		// address (no version, an old one) only briefly, so a replaced or unpublished photo goes quickly.
		const current = new URL(request.url).searchParams.get("v") === String(photo.updatedAt.getTime());
		return new Response(new Uint8Array(photo.data), {
			headers: {
				"Content-Type": photo.mime,
				"Cache-Control": current ? "public, max-age=31536000, immutable" : "public, max-age=300, s-maxage=300",
				"X-Content-Type-Options": "nosniff",
				"Last-Modified": photo.updatedAt.toUTCString(),
			},
		});
	} catch (error) {
		logServerError("Serving an event photo", error);
		return new Response(null, { status: 500, headers: { "Cache-Control": "no-store" } });
	}
}
