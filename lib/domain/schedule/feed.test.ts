import { describe, expect, it } from "vitest";

import { mergeFeed } from "./feed";

const week = ["2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18", "2026-06-19", "2026-06-20", "2026-06-21"];

const event = (id: string, start: string, end: string, type?: string, summary = `Class ${id}`) => ({
	id,
	summary,
	start: { dateTime: start },
	end: { dateTime: end },
	...(type ? { extendedProperties: { private: { jnaninEventType: type } } } : {}),
});

describe("mergeFeed", () => {
	it("lists Google's sessions with their studio day, type and check-ins", () => {
		const feed = mergeFeed({
			days: week,
			events: [event("a", "2026-06-16T09:00:00+01:00", "2026-06-16T10:00:00+01:00", "private")],
			cancelled: [],
			checkIns: new Map([["a", { live: 3, cancelled: 0 }]]),
		});
		expect(feed).toHaveLength(1);
		expect(feed[0]).toMatchObject({ id: "a", day: "2026-06-16", type: "private", status: "scheduled", checkIns: 3 });
		expect(feed[0].event?.id).toBe("a");
	});

	it("shows events made outside the dashboard, as group classes", () => {
		const [only] = mergeFeed({
			days: week,
			events: [event("ext", "2026-06-17T18:00:00+01:00", "2026-06-17T19:00:00+01:00")],
			cancelled: [],
			checkIns: new Map(),
		});
		expect(only).toMatchObject({ type: "group", checkIns: 0 });
	});

	it("places a session on the studio's day, not UTC's", () => {
		// 23:30 UTC on the 15th is 00:30 on the 16th in Marrakech (UTC+1).
		const [late] = mergeFeed({
			days: week,
			events: [event("n", "2026-06-15T23:30:00Z", "2026-06-16T00:30:00Z")],
			cancelled: [],
			checkIns: new Map(),
		});
		expect(late.day).toBe("2026-06-16");
	});

	it("adds the cancelled sessions from our records, in time order, with the credits given back", () => {
		const feed = mergeFeed({
			days: week,
			events: [event("b", "2026-06-18T10:00:00+01:00", "2026-06-18T11:00:00+01:00")],
			cancelled: [
				{
					googleEventId: "c",
					title: "Sunset flow",
					type: "outdoor",
					startsAt: new Date("2026-06-17T17:00:00Z"),
					endsAt: new Date("2026-06-17T18:00:00Z"),
					cancelReason: "rain",
				},
			],
			checkIns: new Map([["c", { live: 0, cancelled: 4 }]]),
		});
		expect(feed.map((s) => s.id)).toEqual(["c", "b"]);
		expect(feed[0]).toMatchObject({
			status: "cancelled",
			day: "2026-06-17",
			title: "Sunset flow",
			checkIns: 0,
			refunded: 4,
			cancelReason: "rain",
			event: null,
		});
	});

	it("keeps only the requested days (Google also returns events overlapping the edges)", () => {
		const feed = mergeFeed({
			days: week,
			events: [event("before", "2026-06-14T22:00:00+01:00", "2026-06-15T01:00:00+01:00")],
			cancelled: [],
			checkIns: new Map(),
		});
		expect(feed).toEqual([]);
	});

	it("never lists a session twice", () => {
		const feed = mergeFeed({
			days: week,
			events: [event("d", "2026-06-19T10:00:00+01:00", "2026-06-19T11:00:00+01:00")],
			cancelled: [
				{
					googleEventId: "d",
					title: "Class d",
					type: "group",
					startsAt: new Date("2026-06-19T09:00:00Z"),
					endsAt: new Date("2026-06-19T10:00:00Z"),
					cancelReason: null,
				},
			],
			checkIns: new Map(),
		});
		expect(feed).toHaveLength(1);
		expect(feed[0].status).toBe("cancelled");
	});
});
