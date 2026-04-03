import { CalendarEvent } from "@/lib/types";

import { calendar_v3,google } from "googleapis";

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
	const auth = new google.auth.OAuth2();
	auth.setCredentials({ access_token: accessToken });

	const calendar = google.calendar({ version: "v3", auth });

	try {
		const response = await calendar.freebusy.query({
			requestBody: {
				timeMin: startTime,
				timeMax: endTime,
				items: [{ id: "primary" }],
			},
		});

		const calendars = response.data.calendars;
		if (!calendars || !calendars["primary"]) {
			return true; // Assume free if we can't read it, though usually this means an error occurred
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
	startTime: string; // ISO string
	endTime: string; // ISO string
	type: JnaninEventType;
	outdoorPrice?: number | null;
}

/**
 * Creates an event on the primary calendar with proper metadata and color coding.
 */
export async function createStudioEvent(
	accessToken: string,
	data: CreateEventData,
): Promise<calendar_v3.Schema$Event> {
	const auth = new google.auth.OAuth2();
	auth.setCredentials({ access_token: accessToken });

	const calendar = google.calendar({ version: "v3", auth });

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
		},
	};

	try {
		const result = await calendar.events.insert({
			calendarId: "primary",
			requestBody: {
				summary: data.title,
				start: {
					dateTime: data.startTime,
				},
				end: {
					dateTime: data.endTime,
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
 * Fetches today's events from the primary calendar to display on the dashboard.
 */
export async function getTodayEvents(accessToken: string): Promise<CalendarEvent[]> {
	const auth = new google.auth.OAuth2();
	auth.setCredentials({ access_token: accessToken });

	const calendar = google.calendar({ version: "v3", auth });

	// Get start and end of "today" in local time
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	const todayEnd = new Date();
	todayEnd.setHours(23, 59, 59, 999);

	try {
		const response = await calendar.events.list({
			calendarId: "primary",
			timeMin: todayStart.toISOString(),
			timeMax: todayEnd.toISOString(),
			singleEvents: true,
			orderBy: "startTime",
		});

		return response.data.items || [];
	} catch (error) {
		console.error("Error fetching today's events:", error);
		throw new Error("Failed to fetch events from Google Calendar.");
	}
}

/**
 * Fetches upcoming events from the primary calendar.
 */
export async function getUpcomingEvents(accessToken: string, daysForward = 7): Promise<CalendarEvent[]> {
	const auth = new google.auth.OAuth2();
	auth.setCredentials({ access_token: accessToken });

	const calendar = google.calendar({ version: "v3", auth });

	const start = new Date();
	start.setHours(0, 0, 0, 0);

	const end = new Date();
	end.setDate(end.getDate() + daysForward);
	end.setHours(23, 59, 59, 999);

	try {
		const response = await calendar.events.list({
			calendarId: "primary",
			timeMin: start.toISOString(),
			timeMax: end.toISOString(),
			singleEvents: true,
			orderBy: "startTime",
		});

		return response.data.items || [];
	} catch (error) {
		console.error("Error fetching upcoming events:", error);
		throw new Error("Failed to fetch events from Google Calendar.");
	}
}

/**
 * Fetches a specific event by its ID.
 */
export async function getEventById(accessToken: string, eventId: string): Promise<CalendarEvent> {
	const auth = new google.auth.OAuth2();
	auth.setCredentials({ access_token: accessToken });

	const calendar = google.calendar({ version: "v3", auth });

	try {
		const response = await calendar.events.get({
			calendarId: "primary",
			eventId: eventId,
		});

		return response.data;
	} catch (error) {
		console.error("Error fetching event by ID:", error);
		throw new Error("Failed to fetch event from Google Calendar.");
	}
}

