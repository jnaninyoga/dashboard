import { DAYS } from "@/lib/config/schedule";
import { dayProblem } from "@/lib/domain/schedule/hours";

import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "A time like 08:00");

/** One working period of a day, from `start` to `end`. */
const periodSchema = z.object({ start: time, end: time });

/** One day of the studio's week: closed, or the periods she works (the rests are the gaps between them). */
const daySchema = z.object({ isOpen: z.boolean(), periods: z.array(periodSchema).max(16) });

/** The studio's week, by day ("1" Monday … "0" Sunday), every open day with periods that don't overlap. */
export const workingHoursSchema = z.record(z.string(), daySchema).superRefine((week, ctx) => {
	for (const { key, label } of DAYS) {
		const day = week[key];
		if (!day) {
			ctx.addIssue({ code: "custom", message: `${label} is missing`, path: [key] });
			continue;
		}
		const problem = dayProblem(day);
		if (problem) ctx.addIssue({ code: "custom", message: `${label}: ${problem.charAt(0).toLowerCase()}${problem.slice(1)}`, path: [key] });
	}
});
