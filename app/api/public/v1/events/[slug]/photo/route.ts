import { logServerError } from "@/lib/errors/server";
import { publicPhotoBySlug } from "@/lib/events/store";

/** An event's photo, for its page and social card on the website. Drafts have none here. */
export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: { params: Promise<{ slug: string }> }) {
	const { slug } = await ctx.params;
	if (!/^[a-z0-9-]{1,80}$/.test(slug)) return new Response(null, { status: 404 });
	try {
		const photo = await publicPhotoBySlug(slug);
		if (!photo) return new Response(null, { status: 404 });
		return new Response(new Uint8Array(photo.data), {
			headers: {
				"Content-Type": photo.mime,
				"Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
				"Last-Modified": photo.updatedAt.toUTCString(),
			},
		});
	} catch (error) {
		logServerError("Serving an event photo", error);
		return new Response(null, { status: 500 });
	}
}
