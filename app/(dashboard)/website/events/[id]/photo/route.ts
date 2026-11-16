import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/services/database";
import { eventPhotos } from "@/services/database/schema";

import { eq } from "drizzle-orm";

/**
 * An event's photo inside the dashboard, drafts included. Signed-in only:
 * the proxy guards every path outside the public API.
 */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
	await requireUser();
	const { id } = await ctx.params;
	if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404 });
	const [photo] = await db.select().from(eventPhotos).where(eq(eventPhotos.eventId, id));
	if (!photo) return new Response(null, { status: 404 });
	return new Response(new Uint8Array(photo.data), { headers: { "Content-Type": photo.mime, "Cache-Control": "private, max-age=3600" } });
}
