// Reading Studio hours from the database, for the dashboard and for the
// website's data. A plain server module, not "use server": nothing here is
// an endpoint of its own.

import { DEFAULT_HOURS } from "@/lib/config/schedule";
import { readWorkingHours, type WorkingHoursConfig } from "@/lib/domain/schedule/hours";
import { db } from "@/services/database";
import { appSettings } from "@/services/database/schema";

import { eq } from "drizzle-orm";

export const STUDIO_HOURS_KEY = "working_hours";

/** Her saved Studio hours (read in either saved shape), or DEFAULT_HOURS until she saves her own. */
export async function readStudioHours(): Promise<WorkingHoursConfig> {
	const [row] = await db.select().from(appSettings).where(eq(appSettings.key, STUDIO_HOURS_KEY));
	if (!row?.value) return DEFAULT_HOURS;
	try {
		return readWorkingHours(JSON.parse(row.value)) ?? DEFAULT_HOURS;
	} catch {
		return DEFAULT_HOURS;
	}
}
