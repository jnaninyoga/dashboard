import { calendar_v3 } from "googleapis";

/**
 * Represents a Google Calendar Event as used within the Jnanin Yoga Dashboard.
 * We extend the base Schema$Event type to ensure consistency.
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
