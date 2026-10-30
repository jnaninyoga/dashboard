import { describe, expect, it } from "vitest";

import { withoutBlankLines } from "./document";

describe("withoutBlankLines", () => {
	it("drops rows left completely empty, keeps anything she started", () => {
		expect(
			withoutBlankLines([
				{ description: "Yoga class", unitPrice: "300" },
				{ description: "", unitPrice: "0" },
				{ description: "  ", unitPrice: "" },
				{ description: "", unitPrice: "120" },
			]),
		).toEqual([
			{ description: "Yoga class", unitPrice: "300" },
			{ description: "", unitPrice: "120" },
		]);
	});
});
