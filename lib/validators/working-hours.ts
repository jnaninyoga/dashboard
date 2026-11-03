import { DAYS } from "@/lib/config/schedule";

import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "A time like 08:00");

/** One day of the studio's week: closed, or open from `start` to `end` (the same day). */
const daySchema = z.object({ isOpen: z.boolean(), start: time, end: time });

/** The studio's week, by day ("1" Monday … "0" Sunday): an open day ends after it starts. */
export const workingHoursSchema = z.record(z.string(), daySchema).superRefine((week, ctx) => {
	for (const { key, label } of DAYS) {
		const day = week[key];
		if (!day) ctx.addIssue({ code: "custom", message: `${label} is missing`, path: [key] });
		else if (day.isOpen && day.end <= day.start) {
			ctx.addIssue({ code: "custom", message: `${label} ends before it starts`, path: [key, "end"] });
		}
	}
});
