import { describe, expect, it } from "vitest";

import { contactOf, whatsappReply } from "./reply";

describe("whatsappReply", () => {
	it("greets by first name in French with the choice", () => {
		expect(
			whatsappReply({ name: "Salma Bennani", lang: "fr", kind: "card", choiceLabel: "Start To Align (1 500 Dh)" }),
		).toBe("Bonjour Salma, c'est Ouarda de jnaninyoga. Merci pour votre demande (Start To Align (1 500 Dh)).");
	});

	it("greets in English and leaves out an open choice", () => {
		expect(whatsappReply({ name: "Tom", lang: "en", kind: "other", choiceLabel: "I'm not sure yet" })).toBe(
			"Hello Tom, this is Ouarda from jnaninyoga. Thank you for your request.",
		);
	});

	it("leaves out an open choice in French", () => {
		expect(whatsappReply({ name: "Salma", lang: "fr", kind: "other", choiceLabel: "—" })).toBe(
			"Bonjour Salma, c'est Ouarda de jnaninyoga. Merci pour votre demande.",
		);
	});
});

describe("contactOf", () => {
	it("has no contact once erased", () => {
		expect(contactOf({ name: "", phone: "", erasedAt: new Date() })).toBeNull();
	});

	it("gives the contact otherwise", () => {
		expect(contactOf({ name: "Salma", phone: "0661286464", erasedAt: null })).toEqual({
			name: "Salma",
			phone: "0661286464",
		});
	});
});
