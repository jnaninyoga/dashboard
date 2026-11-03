import { describe, expect, it } from "vitest";

import { groupSize, lineProduct, namesProduct, productLabel, quantityOf } from "./product";

const famille = { id: "famille", name: "Famille", unit: "session" as const, groupMin: 3, groupMax: 5 };

describe("groupSize", () => {
	it("reads a range, a minimum, or one size", () => {
		expect(groupSize({ groupMin: 3, groupMax: 5 })).toBe("3–5 pax");
		expect(groupSize({ groupMin: 10, groupMax: null })).toBe("10+ pax");
		expect(groupSize({ groupMin: 2, groupMax: 2 })).toBe("2 pax");
		expect(groupSize({ groupMin: null, groupMax: 6 })).toBe("up to 6 pax");
	});

	it("says nothing for any group", () => {
		expect(groupSize({ groupMin: null, groupMax: null })).toBeNull();
	});
});

describe("productLabel", () => {
	it("is how a service reads on a line, with its group", () => {
		expect(productLabel(famille)).toBe("Famille (3–5 pax)");
		expect(productLabel({ name: "Séance privée", groupMin: null, groupMax: null })).toBe("Séance privée");
	});
});

describe("quantityOf", () => {
	it("counts sessions, in her words on screen and on the PDF", () => {
		expect(quantityOf(10, "session")).toBe("10\u00A0sessions");
		expect(quantityOf("1", "session")).toBe("1\u00A0session");
		expect(quantityOf(10, "session", "fr")).toBe("10\u00A0séances");
		expect(quantityOf(1, "session", "fr")).toBe("1\u00A0séance");
		expect(quantityOf(1.5, "session", "fr")).toBe("1,5\u00A0séance");
	});

	it("is the bare number on a line without a unit, written like her amounts", () => {
		expect(quantityOf("2.50", null)).toBe("2,5");
		expect(quantityOf("1200", null)).toBe("1\u00A0200");
	});
});

describe("namesProduct", () => {
	it("holds while the description still names the service", () => {
		expect(namesProduct("Famille (3–5 pax)", "Famille")).toBe(true);
		expect(namesProduct("famille — octobre", "Famille")).toBe(true);
		expect(namesProduct("Location tapis", "Famille")).toBe(false);
		expect(namesProduct("", "Famille")).toBe(false);
	});
});

describe("lineProduct", () => {
	it("keeps the service picked from her price list, and its unit", () => {
		expect(lineProduct({ description: "Famille (3–5 pax)", productId: "famille" }, undefined, famille)).toEqual({
			productId: "famille",
			unit: "session",
		});
	});

	it("lets the service go once the line is written as something else", () => {
		expect(lineProduct({ description: "Location tapis", productId: "famille" }, undefined, famille)).toEqual({
			productId: null,
			unit: null,
		});
	});

	it("drops a service that isn't in her price list", () => {
		expect(lineProduct({ description: "Famille", productId: "gone" }, undefined, undefined)).toEqual({ productId: null, unit: null });
	});

	it("bills an invoice line as its quotation line, whatever it's called now", () => {
		const source = { productId: "famille", unit: "session" as const };
		expect(lineProduct({ description: "Octobre", sourceLineId: "q1", productId: null }, source, undefined)).toEqual(source);
		expect(lineProduct({ description: "Octobre", sourceLineId: "q1" }, undefined, undefined)).toEqual({ productId: null, unit: null });
	});
});
