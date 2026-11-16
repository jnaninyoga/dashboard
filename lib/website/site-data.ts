// What the website builds from, read for the public API. A plain server
// module, not "use server": nothing here is an endpoint of its own.

import { type SitePayload, sitePayload } from "@/lib/domain/website/cards";
import { type ClassTimes, DEFAULT_CLASS_TIMES } from "@/lib/domain/website/timetable";
import { classTimesSchema } from "@/lib/validators/class-times";
import { db } from "@/services/database";
import { appSettings, products } from "@/services/database/schema";

import { eq } from "drizzle-orm";

export const CLASS_TIMES_KEY = "class_times";

/** The saved class times, or the timetable the site always had until she saves her own. */
export async function readClassTimes(): Promise<ClassTimes> {
	const [row] = await db.select().from(appSettings).where(eq(appSettings.key, CLASS_TIMES_KEY));
	if (!row) return DEFAULT_CLASS_TIMES;
	try {
		const parsed = classTimesSchema.safeParse(JSON.parse(row.value));
		return parsed.success ? parsed.data : DEFAULT_CLASS_TIMES;
	} catch {
		return DEFAULT_CLASS_TIMES;
	}
}

export async function loadSitePayload(now: Date = new Date()): Promise<SitePayload> {
	const [classTimes, all] = await Promise.all([readClassTimes(), db.select().from(products).where(eq(products.kind, "membership"))]);
	return sitePayload({ classTimes, products: all, now });
}
