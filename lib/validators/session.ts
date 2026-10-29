import { fromStudioTime } from "@/lib/utils/time";

import { z } from "zod";

// Morocco's offsets are whole hours, so flooring in UTC floors the studio hour too.
export const currentHourStart = () => new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000);

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
