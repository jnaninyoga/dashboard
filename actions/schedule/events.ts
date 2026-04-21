"use server";

import { type ScheduleEventInput, type WorkingHoursConfig } from "@/lib/types";
import { checkAvailability, createStudioEvent } from "@/services/google";
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

	// RULE 1: Shop Hours Verification
	let workingHours = await getWorkingHours();
	if (!workingHours) {
		workingHours = DEFAULT_HOURS;
	}

	const dayConfig = workingHours[data.weekday.toString()];
	if (!dayConfig || !dayConfig.isOpen) {
		return { error: "Studio is closed on this day." };
	}

	// Simple string comparison works for HH:mm formats (e.g. "08:00" >= "07:00")
	if (data.startTimeStr < dayConfig.start || data.endTimeStr > dayConfig.end) {
		return {
			error: `Requested time is outside open hours. The studio is open from ${dayConfig.start} to ${dayConfig.end} on this day.`,
		};
	}

	// Get Token
	let accessToken: string;
	try {
		accessToken = await getValidAccessToken(user.id);
	} catch {
		return { error: "Session expired or disconnected. Please relogin to sync with Google Calendar." };
	}

	// RULE 2: Anti-Conflict Verification (Google Calendar FreeBusy API)
	const isFree = await checkAvailability(accessToken, data.isoStart, data.isoEnd);
	if (!isFree) {
		return { error: "Slot is already booked. Conflict detected." };
	}

	// RULE 3: Execution
	try {
		const newEvent = await createStudioEvent(accessToken, {
			title: data.title,
			startTime: data.isoStart,
			endTime: data.isoEnd,
			type: data.type,
			outdoorPrice: data.outdoorPrice,
			b2bPrice: data.b2bPrice,
			b2bPaxLabel: data.b2bPaxLabel,
		});

		return { success: true, event: newEvent };
	} catch (error) {
		console.error("Failed to schedule event:", error);
		return { error: "Failed to create the event in Google Calendar." };
	}
}
