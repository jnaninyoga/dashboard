// What the website builds from, read for the public API. A plain server
// module, not "use server": nothing here is an endpoint of its own.

import { siteEvents } from "@/lib/domain/events/rules";
import { type SitePayload, sitePayload } from "@/lib/domain/website/cards";
import { outdoorSessionsForSite } from "@/lib/events/store";
import { db } from "@/services/database";
import { products } from "@/services/database/schema";

import { eq } from "drizzle-orm";

import { readStudioHours } from "./studio-hours";

export async function loadSitePayload(now: Date = new Date()): Promise<SitePayload> {
	const [hours, all, eventRows] = await Promise.all([
		readStudioHours(),
		db.select().from(products).where(eq(products.kind, "membership")),
		outdoorSessionsForSite(),
	]);
	return sitePayload({ hours, products: all, events: siteEvents(eventRows), now });
}
