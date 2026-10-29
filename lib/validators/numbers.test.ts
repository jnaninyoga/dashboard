import { describe, expect, it } from "vitest";
import { z } from "zod";

import { categorySchema } from "./category";
import { membershipProductSchema } from "./membership";
import { numberFromInput } from "./shared";

describe("numberFromInput", () => {
	const price = numberFromInput(z.number().min(0, "Price must be positive"));

	it("accepts what the field holds while typing and yields a number", () => {
		expect(price.parse("500.50")).toBe(500.5);
		expect(price.parse("500,50")).toBe(500.5);
		expect(price.parse(12)).toBe(12);
	});

	it("explains empty or non-numeric input instead of a type error", () => {
		const result = price.safeParse("");
		expect(result.success).toBe(false);
		expect(result.error?.issues[0].message).toBe("Enter a number");
	});

	it("still applies the field's own rules", () => {
		expect(price.safeParse("-3").error?.issues[0].message).toBe("Price must be positive");
	});
});

describe("forms that hold numbers as text", () => {
	// These failed with 'expected number, received string' once a number
	// field had been typed into, so the forms could not be saved.
	it("saves a category with a typed discount", () => {
		const parsed = categorySchema.parse({ name: "Senior", discountType: "percentage", discountValue: "12.5" });
		expect(parsed.discountValue).toBe(12.5);
	});

	it("saves a membership with a typed price", () => {
		const parsed = membershipProductSchema.parse({
			name: "Pass 1 mois",
			basePrice: "500,50",
			durationMonths: 1,
			defaultCredits: 12,
		});
		expect(parsed.basePrice).toBe(500.5);
	});
});
