import { describe, expect, it } from "vitest";
import { z } from "zod";

import { discountSchema } from "./discount";
import { partnerServiceSchema, productSchema } from "./product";
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
	it("saves a discount typed with a French comma", () => {
		const parsed = discountSchema.parse({ name: "Senior", discountType: "percentage", discountValue: "12,5" });
		expect(parsed.discountValue).toBe(12.5);
	});

	it("saves a membership with a typed price", () => {
		const parsed = productSchema.parse({ kind: "membership", name: "Pass 1 mois", price: "500,50", durationMonths: "1", credits: "12" });
		expect(parsed).toMatchObject({ price: 500.5, durationMonths: 1, credits: 12 });
	});

	it("saves a partner service for any group, or a group in order", () => {
		const service = (groupMin: string, groupMax: string) => ({ kind: "partner_service", name: "Famille", price: "450", groupMin, groupMax });
		expect(partnerServiceSchema.parse(service("", ""))).toMatchObject({ groupMin: null, groupMax: null });
		expect(partnerServiceSchema.parse(service("10", ""))).toMatchObject({ groupMin: 10, groupMax: null });
		const backwards = partnerServiceSchema.safeParse(service("5", "3"));
		expect(backwards.success ? null : backwards.error.issues[0].path).toEqual(["groupMax"]);
		expect(partnerServiceSchema.safeParse(service("2.5", "")).success).toBe(false);
	});
});
