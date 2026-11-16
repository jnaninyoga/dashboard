import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/services/database";
import { sessionPhotos, studioSessions } from "@/services/database/schema";

import { eq } from "drizzle-orm";

/** An outdoor session's photo inside the dashboard, whether the website shows it or not. Signed-in only, like every page. */
export async function GET(_request: Request, ctx: { params: Promise<{ eventId: string }> }) {
	await requireUser();
	const { eventId } = await ctx.params;
	const [row] = await db
		.select({ mime: sessionPhotos.mime, data: sessionPhotos.data })
		.from(sessionPhotos)
		.innerJoin(studioSessions, eq(studioSessions.id, sessionPhotos.sessionId))
		.where(eq(studioSessions.googleEventId, eventId));
	if (!row) return new Response(null, { status: 404 });
	return new Response(new Uint8Array(row.data), { headers: { "Content-Type": row.mime, "Cache-Control": "private, max-age=3600" } });
}
