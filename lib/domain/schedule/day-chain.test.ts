import { describe, expect, it } from "vitest";

import { addPeriod, inOrder, restsOf, showLength } from "./day-chain";

// Monday on the website before it came from the dashboard: six periods, a long rest at lunch.
const day = [
	{ start: "08:30", end: "10:00" },
	{ start: "10:30", end: "12:00" },
	{ start: "12:30", end: "14:00" },
	{ start: "15:30", end: "17:00" },
	{ start: "17:30", end: "19:00" },
	{ start: "19:30", end: "21:00" },
];
const starts = (times: { start: string }[]) => times.map((t) => t.start);

describe("restsOf", () => {
	it("reads her day as periods and rests: half an hour, and the long break at lunch", () => {
		expect(restsOf(day)).toEqual([30, 30, 90, 30, 30]);
	});
});

describe("addPeriod", () => {
	it("adds one after the last, with its rest and its length", () => {
		expect(addPeriod(day).at(-1)).toEqual({ start: "21:30", end: "23:00" });
	});

	it("starts an empty day at 9:00 for an hour and a half", () => {
		expect(addPeriod([])).toEqual([{ start: "09:00", end: "10:30" }]);
	});

	it("stays inside the day", () => {
		expect(addPeriod([{ start: "22:00", end: "23:30" }]).at(-1)).toEqual({ start: "23:59", end: "23:59" });
	});
});

describe("inOrder and showLength", () => {
	it("sorts by start and says lengths as she would", () => {
		expect(starts(inOrder([day[2], day[0], day[1]]))).toEqual(["08:30", "10:30", "12:30"]);
		expect([showLength(90), showLength(120), showLength(45), showLength(75)]).toEqual(["1h30", "2h", "45 min", "1h15"]);
	});
});
