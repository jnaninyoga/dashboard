import { describe, expect, it } from "vitest";

import { calendarCheck } from "./calendar";

// June 2026: every version of the time-zone data puts Marrakech on UTC+1.
const row = {
	title: "Lever de soleil à l'Agafay",
	startsAt: new Date("2026-06-20T06:00:00Z"),
	endsAt: new Date("2026-06-20T08:00:00Z"),
};

const event = (over: Record<string, unknown> = {}) => ({
	id: "g1",
	status: "confirmed",
	summary: row.title,
	start: { dateTime: "2026-06-20T07:00:00+01:00" },
	end: { dateTime: "2026-06-20T09:00:00+01:00" },
	...over,
});

describe("calendarCheck", () => {
	it("leaves a session alone when her calendar says the same", () => {
		expect(calendarCheck(row, event())).toEqual({ kind: "same" });
	});

	it("follows a session she moved in Google Calendar", () => {
		const moved = event({ start: { dateTime: "2026-06-27T08:00:00+01:00" }, end: { dateTime: "2026-06-27T10:00:00+01:00" } });
		expect(calendarCheck(row, moved)).toEqual({
			kind: "changed",
			set: { title: row.title, startsAt: new Date("2026-06-27T07:00:00Z"), endsAt: new Date("2026-06-27T09:00:00Z") },
		});
	});

	it("follows a session she renamed in Google Calendar", () => {
		expect(calendarCheck(row, event({ summary: "Agafay au lever du soleil" }))).toEqual({
			kind: "changed",
			set: { title: "Agafay au lever du soleil", startsAt: row.startsAt, endsAt: row.endsAt },
		});
	});

	it("keeps the title when the calendar's is blank", () => {
		expect(calendarCheck(row, event({ summary: "  " }))).toEqual({ kind: "same" });
	});

	it("says gone when the event no longer exists", () => {
		expect(calendarCheck(row, null)).toEqual({ kind: "gone" });
	});

	it("says gone when Google still returns the event, deleted", () => {
		expect(calendarCheck(row, event({ status: "cancelled" }))).toEqual({ kind: "gone" });
	});

	it("places an all-day event at the studio's midnight", () => {
		const allDay = event({ start: { date: "2026-06-21" }, end: { date: "2026-06-22" } });
		expect(calendarCheck(row, allDay)).toEqual({
			kind: "changed",
			set: { title: row.title, startsAt: new Date("2026-06-20T23:00:00Z"), endsAt: new Date("2026-06-21T23:00:00Z") },
		});
	});
});
