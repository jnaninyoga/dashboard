import { calendar_v3 } from "googleapis";

/**
 * Represents a Google Calendar Event as used within the Jnanin Yoga Dashboard.
 */
export type CalendarEvent = calendar_v3.Schema$Event;

/**
 * Grouped events used for rendering the schedule.
 */
export type GroupedEvents = Record<string, CalendarEvent[]>;

/**
 * Jnanin Yoga Event Types based on studio categories.
 */
export type JnaninEventType = "group" | "private" | "outdoor" | "b2b";

/**
 * Input for scheduling a new event (shared between UI and Server Actions).
 */
export interface ScheduleEventInput {
	title: string;
	dateStr: string; // "YYYY-MM-DD", on the studio's clock
	startTimeStr: string; // "HH:mm"
	endTimeStr: string; // "HH:mm"
	type: JnaninEventType;
	outdoorPrice?: number | null;
	b2bPrice?: number | null;
	b2bPaxLabel?: string | null;
}
