import { describe, expect, it } from "vitest";

import { withoutVisitorData } from "./redact";

describe("withoutVisitorData", () => {
	it("keeps the failure's kind but not the values a visitor sent", () => {
		const cause = Object.assign(new Error('duplicate key value violates unique constraint "booking_requests_ref_unique"'), {
			code: "23505",
			constraint_name: "booking_requests_ref_unique",
			detail: "Key (phone)=(0661286464) already exists.",
		});
		const error = Object.assign(new Error('Failed query: insert into "booking_requests" ...\nparams: Salma,0661286464'), {
			name: "DrizzleQueryError",
			query: 'insert into "booking_requests" ("name", "phone") values ($1, $2)',
			params: ["Salma", "0661286464"],
			cause,
		});

		const logged = JSON.stringify(withoutVisitorData(error));
		expect(logged).not.toContain("0661286464");
		expect(logged).not.toContain("Salma");
		expect(withoutVisitorData(error)).toEqual({
			name: "DrizzleQueryError",
			code: "23505",
			constraint: "booking_requests_ref_unique",
			query: 'insert into "booking_requests" ("name", "phone") values ($1, $2)',
		});
	});

	it("names a plain failure without its message", () => {
		expect(withoutVisitorData(new TypeError("Salma's phone is 0661286464"))).toEqual({ name: "TypeError" });
	});

	it("handles something that isn't an error", () => {
		expect(withoutVisitorData("boom")).toEqual({ name: "unknown" });
	});
});
