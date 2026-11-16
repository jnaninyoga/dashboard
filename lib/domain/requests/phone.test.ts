import { describe, expect, it } from "vitest";

import { phoneKey, toE164 } from "./phone";

describe("phoneKey", () => {
	it.each([
		["+212 661 286 464", "212661286464"],
		["0661286464", "212661286464"],
		["00212661286464", "212661286464"],
		["+212 (0)6 61 28 64 64", "212661286464"],
		["+33 6 12 34 56 78", "33612345678"],
	])("keys %s", (input, key) => {
		expect(phoneKey(input)).toBe(key);
	});

	it("has no key for too few digits", () => {
		expect(phoneKey("12 34")).toBeNull();
		expect(phoneKey("")).toBeNull();
	});
});

describe("toE164", () => {
	it("writes E.164 for the phone field", () => {
		expect(toE164("06 61 28 64 64")).toBe("+212661286464");
	});

	it("has nothing for a number it can't read", () => {
		expect(toE164("12")).toBeUndefined();
	});
});
