"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { DEFAULT_HOURS } from "@/lib/config/schedule";
import { type ClassTimes, classTimesProblems, normalizeClassTimes } from "@/lib/domain/website/timetable";
import { logServerError } from "@/lib/errors/server";
import { classTimesSchema } from "@/lib/validators/class-times";
import { type RebuildOutcome, requestSiteRebuild } from "@/lib/website/rebuild";
import { CLASS_TIMES_KEY, readClassTimes } from "@/lib/website/site-data";
import { db } from "@/services/database";
import { appSettings } from "@/services/database/schema";

import { getWorkingHours } from "./settings";

type Result = { success?: true; error?: string; ref?: string; website?: RebuildOutcome };

/** The class times the website shows. */
export async function getClassTimes(): Promise<ClassTimes> {
	await requireUser();
	return readClassTimes();
}

/**
 * Saves the website's class times once they fit the studio's hours, then
 * rebuilds the site. A save never waits on the site: if the rebuild can't
 * start, she's told and the times are kept.
 */
export async function saveClassTimesAction(data: unknown): Promise<Result> {
	await requireUser();
	const parsed = classTimesSchema.safeParse(data);
	if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the times" };
	const classTimes = normalizeClassTimes(parsed.data);
	try {
		const problems = classTimesProblems(classTimes, (await getWorkingHours()) ?? DEFAULT_HOURS);
		if (problems.length) return { error: problems[0] };
		const value = JSON.stringify(classTimes);
		await db
			.insert(appSettings)
			.values({ key: CLASS_TIMES_KEY, value })
			.onConflictDoUpdate({ target: appSettings.key, set: { value } });
		revalidatePath("/website/class-times");
	} catch (error) {
		return { error: "Couldn't save the class times", ref: logServerError("Saving class times", error) };
	}
	return { success: true, website: await requestSiteRebuild("class times") };
}
