"use server";

import { revalidatePath } from "next/cache";

import { logServerError } from "@/lib/errors/server";
import { type ScheduleEventInput, type WorkingHoursConfig } from "@/lib/types";
import { fromStudioTime, studioIsoString, weekdayOf } from "@/lib/utils/time";
import { currentHourStart } from "@/lib/validators/session";
import { cancelStudioEvent, checkAvailability, createStudioEvent } from "@/services/google";
import { getValidAccessToken } from "@/services/google";
import { createClient } from "@/services/supabase/server";

import { getWorkingHours } from "../settings";

const DEFAULT_HOURS: WorkingHoursConfig = {
	"1": { isOpen: true, start: "08:00", end: "20:00" },
	"2": { isOpen: true, start: "08:00", end: "20:00" },
	"3": { isOpen: true, start: "08:00", end: "20:00" },
	"4": { isOpen: true, start: "08:00", end: "20:00" },
	"5": { isOpen: true, start: "08:00", end: "20:00" },
	"6": { isOpen: true, start: "08:00", end: "14:00" },
	"0": { isOpen: false, start: "08:00", end: "20:00" },
};

export async function scheduleNewEventAction(data: ScheduleEventInput) {
	// Authentication
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "Not authenticated" };
	}

	// The times are the studio's wall clock; the phone's zone doesn't matter.
	const isoStart = studioIsoString(data.dateStr, data.startTimeStr);
	const isoEnd = studioIsoString(data.dateStr, data.endTimeStr);
	const weekday = weekdayOf(data.dateStr);

	// RULE 0: Reject past events. Events must start from the current hour onwards.
	if (fromStudioTime(data.dateStr, data.startTimeStr) < currentHourStart()) {
		return { error: "This time has already passed. Pick a later start." };
	}

	// RULE 1: Shop Hours Verification — only enforced for in-studio event types.
	// B2B and outdoor sessions are held off-site and are not bound to studio hours.
	const isStudioEvent = data.type === "group" || data.type === "private";
	if (isStudioEvent) {
		let workingHours = await getWorkingHours();
		if (!workingHours) {
			workingHours = DEFAULT_HOURS;
		}

		const dayConfig = workingHours[weekday.toString()];
		if (!dayConfig || !dayConfig.isOpen) {
			return { error: "Studio is closed on this day." };
		}

		// Simple string comparison works for HH:mm formats (e.g. "08:00" >= "07:00")
		if (data.startTimeStr < dayConfig.start || data.endTimeStr > dayConfig.end) {
			return {
				error: `Requested time is outside open hours. The studio is open from ${dayConfig.start} to ${dayConfig.end} on this day.`,
			};
		}
	}

	// Get Token
	let accessToken: string;
	try {
		accessToken = await getValidAccessToken(user.id);
	} catch {
		return { error: "Session expired or disconnected. Please relogin to sync with Google Calendar." };
	}

	// RULE 2: Anti-Conflict Verification (Google Calendar FreeBusy API)
	const isFree = await checkAvailability(accessToken, isoStart, isoEnd);
	if (!isFree) {
		return { error: "Slot is already booked. Conflict detected." };
	}

	// RULE 3: Execution
	try {
		const newEvent = await createStudioEvent(accessToken, {
			title: data.title,
			startTime: isoStart,
			endTime: isoEnd,
			type: data.type,
			outdoorPrice: data.outdoorPrice,
			b2bPrice: data.b2bPrice,
			b2bPaxLabel: data.b2bPaxLabel,
		});

		return { success: true, event: newEvent };
	} catch (error) {
		return { error: "Failed to create the event in Google Calendar.", ref: logServerError("Failed to schedule event", error) };
	}
}

/**
 * Cancels an event by deleting it from Google Calendar. Local attendance
 * records (if any) remain intact so past check-ins stay queryable.
 */
export async function cancelEventAction(eventId: string) {
	if (!eventId) {
		return { error: "Missing event id." };
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "Not authenticated" };
	}

	let accessToken: string;
	try {
		accessToken = await getValidAccessToken(user.id);
	} catch {
		return { error: "Session expired or disconnected. Please relogin to sync with Google Calendar." };
	}

	try {
		await cancelStudioEvent(accessToken, eventId);
	} catch (error) {
		return { error: "Failed to cancel the event in Google Calendar.", ref: logServerError("Failed to cancel event", error) };
	}

	revalidatePath("/schedule");
	revalidatePath("/");

	return { success: true };
}
