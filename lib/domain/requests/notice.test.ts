import { describe, expect, it } from "vitest";

import { requestEmail, requestPushPayload } from "./notice";

const request = {
	id: "abc",
	ref: "WEB-1A2B3C4D",
	name: "<b>Salma</b>",
	phone: "06 61 28 64 64",
	choiceLabel: "Start To Align (1 500 Dh)",
	message: "first time & a bit stiff",
	lang: "fr" as const,
};

describe("requestEmail", () => {
	it("escapes what the visitor typed", () => {
		const { html, subject } = requestEmail(request, "https://dash.jnaninyoga.com");
		expect(html).toContain("&lt;b&gt;Salma&lt;/b&gt;");
		expect(html).not.toContain("<b>Salma</b>");
		expect(html).toContain("first time &amp; a bit stiff");
		expect(subject).toBe("Website: Réservation de <b>Salma</b>");
	});

	it("links to the request and to WhatsApp with the country code", () => {
		const { html, text } = requestEmail(request, "https://dash.jnaninyoga.com");
		expect(html).toContain("https://dash.jnaninyoga.com/bookings/abc");
		expect(html).toContain("https://wa.me/212661286464");
		expect(text).toContain("WEB-1A2B3C4D");
		expect(text).toContain("https://dash.jnaninyoga.com/bookings/abc");
	});

	it("leaves the message out when there is none", () => {
		const { html } = requestEmail({ ...request, message: null }, "https://dash.jnaninyoga.com");
		expect(html).not.toContain("white-space:pre-line");
	});
});

describe("requestPushPayload", () => {
	it("makes a short phone notification", () => {
		expect(requestPushPayload({ ...request, message: "x".repeat(100) })).toEqual({
			title: "<b>Salma</b>",
			body: `Start To Align (1 500 Dh) · ${"x".repeat(80)}…`,
			url: "/bookings/abc",
			tag: "abc",
		});
	});

	it("is just the choice without a message", () => {
		expect(requestPushPayload({ ...request, message: null }).body).toBe("Start To Align (1 500 Dh)");
	});

	it("keeps a short message whole", () => {
		expect(requestPushPayload(request).body).toBe("Start To Align (1 500 Dh) · first time & a bit stiff");
	});
});
