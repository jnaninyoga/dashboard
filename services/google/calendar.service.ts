import { CalendarEvent } from "@/lib/types";
import { addDays, STUDIO_TIME_ZONE, studioDateString, studioDaysRange } from "@/lib/utils/time";

import { calendar_v3 } from "googleapis";

import { getGoogleClient } from "./client.service";

/**
 * Checks if the primary calendar is free during the requested time window.
 * Returns true if available (no overlaps), false if there is a conflict.
 *
 * @param accessToken The Google OAuth access token
 * @param startTime ISO string of the start time (e.g. 2024-10-25T08:00:00+01:00)
 * @param endTime ISO string of the end time
 */
export async function checkAvailability(
	accessToken: string,
	startTime: string,
	endTime: string,
): Promise<boolean> {
	const google = getGoogleClient(accessToken);

	try {
		const response = await google.calendar.freebusy.query({
			requestBody: {
				timeMin: startTime,
				timeMax: endTime,
				items: [{ id: "primary" }],
			},
		});

		const calendars = response.data.calendars;
		if (!calendars || !calendars["primary"]) {
			return true; // Assume free if we can't read it
		}

		const busy = calendars["primary"].busy;
		if (busy && busy.length > 0) {
			return false; // Conflict found
		}

		return true; // No conflicts
	} catch (error) {
		console.error("Error checking FreeBusy:", error);
		throw new Error("Failed to check availability with Google Calendar.");
	}
}

export type JnaninEventType = "group" | "private" | "outdoor" | "b2b";

interface CreateEventData {
	title: string;
	/** Wall-clock "YYYY-MM-DDTHH:mm:ss" in `timeZone`; Google works out the offset. */
	startTime: string;
	endTime: string;
	timeZone: string;
	type: JnaninEventType;
	outdoorPrice?: number | null;
	b2bPrice?: number | null;
	b2bPaxLabel?: string | null;
}

/**
 * Creates an event on the primary calendar with proper metadata and color coding.
 */
export async function createStudioEvent(
	accessToken: string,
	data: CreateEventData,
): Promise<calendar_v3.Schema$Event> {
	const google = getGoogleClient(accessToken);

	let colorId = "1"; // default
	switch (data.type) {
		case "group":
			colorId = "9"; // Blue
			break;
		case "private":
			colorId = "6"; // Orange
			break;
		case "b2b":
			colorId = "11"; // Red
			break;
		case "outdoor":
			colorId = "2"; // Green
			break;
	}

	const extendedProperties = {
		private: {
			jnaninEventType: data.type,
			...(data.outdoorPrice
				? { outdoorPrice: data.outdoorPrice.toString() }
				: {}),
			...(data.b2bPrice
				? { jnaninEventPrice: data.b2bPrice.toString() }
				: {}),
			...(data.b2bPaxLabel
				? { jnaninB2BPaxLabel: data.b2bPaxLabel }
				: {}),
		},
	};

	try {
		const result = await google.calendar.events.insert({
			calendarId: "primary",
			requestBody: {
				summary: data.title,
				start: {
					dateTime: data.startTime,
					timeZone: data.timeZone,
				},
				end: {
					dateTime: data.endTime,
					timeZone: data.timeZone,
				},
				colorId,
				extendedProperties,
			},
		});

		return result.data;
	} catch (error) {
		console.error("Error creating Studio Event:", error);
		throw new Error("Failed to create event in Google Calendar.");
	}
}

/**
 * Every event between two instants, in one request: what the Schedule, the
 * week strip and today's agenda read. Recurring events come as their
 * single occurrences, in time order.
 */
export async function getEventsBetween(accessToken: string, start: Date, end: Date): Promise<CalendarEvent[]> {
	const google = getGoogleClient(accessToken);

	try {
		const response = await google.calendar.events.list({
			calendarId: "primary",
			timeMin: start.toISOString(),
			timeMax: end.toISOString(),
			singleEvents: true,
			orderBy: "startTime",
			// A week is far below this; one page means one request.
			maxResults: 250,
			// Times come back as the studio's wall clock, placed by Google's
			// always-current zone rules (see wallClockOf).
			timeZone: STUDIO_TIME_ZONE,
		});

		return response.data.items || [];
	} catch (error) {
		console.error("Error fetching events:", error);
		throw new Error("Failed to fetch events from Google Calendar.");
	}
}

/** Today's events, today being the studio's day in Marrakech (not the server's). */
export async function getTodayEvents(accessToken: string): Promise<CalendarEvent[]> {
	const today = studioDateString();
	const { start, end } = studioDaysRange(today, today);
	return getEventsBetween(accessToken, start, end);
}

/** Events from the start of the studio's today through `daysForward` more days. */
export async function getUpcomingEvents(accessToken: string, daysForward = 7): Promise<CalendarEvent[]> {
	const today = studioDateString();
	const { start, end } = studioDaysRange(today, addDays(today, daysForward));
	return getEventsBetween(accessToken, start, end);
}

/**
 * Deletes an event from the primary calendar, freeing the slot (Google tells
 * invited guests). An event that is already gone counts as deleted, so a
 * cancellation that stopped halfway can simply be tried again.
 */
export async function cancelStudioEvent(
	accessToken: string,
	eventId: string,
): Promise<void> {
	const google = getGoogleClient(accessToken);

	try {
		await google.calendar.events.delete({
			calendarId: "primary",
			eventId,
		});
	} catch (error) {
		const status = (error as { response?: { status?: number } }).response?.status;
		if (status === 404 || status === 410) return;
		console.error("Error cancelling Studio Event:", error);
		throw new Error("Failed to cancel event in Google Calendar.");
	}
}

/**
 * Fetches a specific event by its ID.
 */
/** The event, or null when Google says it doesn't exist (or was deleted). */
export async function getEventById(accessToken: string, eventId: string): Promise<CalendarEvent | null> {
	const google = getGoogleClient(accessToken);

	try {
		const response = await google.calendar.events.get({
			calendarId: "primary",
			eventId: eventId,
			timeZone: STUDIO_TIME_ZONE,
		});

		return response.data;
	} catch (error) {
		const status = (error as { response?: { status?: number } }).response?.status;
		if (status === 404 || status === 410) return null;
		console.error("Error fetching event by ID:", error);
		throw new Error("Failed to fetch event from Google Calendar.");
	}
}
