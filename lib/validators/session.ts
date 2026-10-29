import { currentHourStart, fromStudioTime, studioDateString, toStudioTime } from "@/lib/utils/time";

import { z } from "zod";

const hour = (h: number) => `${String(h).padStart(2, "0")}:00`;

/**
 * Where a new session starts by default: the next full hour on the studio's
 * clock, no earlier than 08:00 and no later than 19:00; after that, 08:00 the
 * next morning. One hour long.
 */
export function defaultSessionSlot(now: Date = new Date()) {
	const next = toStudioTime(now).getHours() + 1;
	const tomorrow = next > 19;
	const start = tomorrow ? 8 : Math.max(8, next);
	return {
		dateStr: studioDateString(tomorrow ? new Date(now.getTime() + 86_400_000) : now),
		startTimeStr: hour(start),
		endTimeStr: hour(start + 1),
	};
}

// --- SESSION SCHEMA (Booking flow) ---
export const sessionSchema = z
	.object({
		title: z.string().min(1, "Title is required"),
		dateStr: z.string().min(1, "Date is required"),
		startTimeStr: z.string().min(1, "Start time is required"),
		endTimeStr: z.string().min(1, "End time is required"),
		type: z.enum(["group", "private", "outdoor", "b2b"]),
		outdoorPrice: z.string().optional(),
		b2bTierId: z.string().optional(),
	})
	.refine(
		(data) => {
			return data.startTimeStr < data.endTimeStr;
		},
		{
			message: "End time must be after start time",
			path: ["endTimeStr"],
		},
	)
	.refine(
		(data) => {
			// Events can only start from the current hour onwards, on the
			// studio's clock (not the phone's or the server's).
			const eventStart = fromStudioTime(data.dateStr, data.startTimeStr);
			if (isNaN(eventStart.getTime())) return true; // format issues handled elsewhere
			return eventStart >= currentHourStart();
		},
		{
			message: "This time has already passed. Pick a later start.",
			path: ["startTimeStr"],
		},
	)
	.refine(
		(data) => {
			if (
				data.type === "outdoor" &&
				(!data.outdoorPrice || isNaN(Number(data.outdoorPrice)))
			) {
				return false;
			}
			return true;
		},
		{
			message: "Valid price is required for outdoor sessions",
			path: ["outdoorPrice"],
		},
	)
	.refine(
		(data) => {
			if (data.type === "b2b" && !data.b2bTierId) {
				return false;
			}
			return true;
		},
		{
			message: "Please select a B2B pricing tier",
			path: ["b2bTierId"],
		},
	);

export type SessionFormValues = z.infer<typeof sessionSchema>;
