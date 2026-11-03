import { describe, expect, it } from "vitest";

import { formatPhone, whatsappHref } from "./contact";

describe("formatPhone", () => {
	it("groups an international number the way it is read aloud", () => {
		expect(formatPhone("+212661234567")).toBe("+212 6 61 23 45 67");
		expect(formatPhone("+33612345678")).toBe("+33 6 12 34 56 78");
	});

	it("leaves a number it can't read as it was typed", () => {
		expect(formatPhone("0661234567")).toBe("0661234567");
	});
});

describe("whatsappHref", () => {
	it("keeps only the digits", () => {
		expect(whatsappHref("+212 6 61 23 45 67")).toBe("https://wa.me/212661234567");
	});
});
