import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "A time like 08:30");

/** The website's class times: the days they run (0 Sunday … 6 Saturday) and the times, the same each day. */
export const classTimesSchema = z.object({
	days: z.array(z.number().int().min(0).max(6)).max(7),
	times: z.array(z.object({ start: time, end: time })).max(20, "That's a lot of classes: 20 at most"),
});
