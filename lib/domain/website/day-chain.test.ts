import { describe, expect, it } from "vitest";

import { addClass, inOrder, restsOf, setLength, setRest, setStart, showLength } from "./day-chain";
import { DEFAULT_CLASS_TIMES } from "./timetable";

const day = DEFAULT_CLASS_TIMES.times;
const starts = (times: { start: string }[]) => times.map((t) => t.start);

describe("restsOf", () => {
	it("reads her day as classes and rests: half an hour, and the long break at lunch", () => {
		expect(restsOf(day)).toEqual([30, 30, 90, 30, 30]);
	});
});

describe("setRest", () => {
	it("moves the classes after the rest, and keeps the other rests", () => {
		const longer = setRest(day, 0, 45);
		expect(starts(longer)).toEqual(["08:30", "10:45", "12:45", "15:45", "17:45", "19:45"]);
		expect(restsOf(longer)).toEqual([45, 30, 90, 30, 30]);
	});

	it("never goes below no rest at all", () => {
		expect(restsOf(setRest(day, 1, -30))).toEqual([30, 0, 90, 30, 30]);
	});
});

describe("setLength", () => {
	it("changes one class and moves the ones after it, rests kept", () => {
		const shorter = setLength(day, 2, 60);
		expect(shorter[2]).toEqual({ start: "12:30", end: "13:30" });
		expect(starts(shorter).slice(3)).toEqual(["15:00", "17:00", "19:00"]);
		expect(restsOf(shorter)).toEqual([30, 30, 90, 30, 30]);
	});

	it("keeps a class at least a quarter of an hour", () => {
		expect(setLength(day, 0, 0)[0]).toEqual({ start: "08:30", end: "08:45" });
	});
});

describe("setStart", () => {
	it("moves the whole day from its first class", () => {
		expect(starts(setStart(day, 0, "09:00"))).toEqual(["09:00", "11:00", "13:00", "16:00", "18:00", "20:00"]);
	});

	it("changes only the rest before a later class", () => {
		const earlier = setStart(day, 3, "15:00");
		expect(restsOf(earlier)).toEqual([30, 30, 60, 30, 30]);
		expect(earlier.at(-1)).toEqual({ start: "19:00", end: "20:30" });
	});

	it("ignores a half-typed time", () => {
		expect(setStart(day, 0, "")).toEqual(day);
	});
});

describe("addClass", () => {
	it("adds one after the last, with its rest and its length", () => {
		expect(addClass(day).at(-1)).toEqual({ start: "21:30", end: "23:00" });
	});

	it("starts an empty day at 9:00 for an hour and a half", () => {
		expect(addClass([])).toEqual([{ start: "09:00", end: "10:30" }]);
	});

	it("stays inside the day", () => {
		expect(addClass([{ start: "22:00", end: "23:30" }]).at(-1)).toEqual({ start: "23:59", end: "23:59" });
	});
});

describe("inOrder and showLength", () => {
	it("sorts by start and says lengths as she would", () => {
		expect(starts(inOrder([day[2], day[0], day[1]]))).toEqual(["08:30", "10:30", "12:30"]);
		expect([showLength(90), showLength(120), showLength(45), showLength(75)]).toEqual(["1h30", "2h", "45 min", "1h15"]);
	});
});
