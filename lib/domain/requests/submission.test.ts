import { describe, expect, it } from "vitest";

import { findDuplicate, newRequestRef, parseSubmission } from "./submission";

const good = {
	name: "Salma B.",
	phone: "06 61 28 64 64",
	choice: "Start To Align (1 500 Dh)",
	choiceKey: "plan:start-to-align",
	message: "  first time  ",
	lang: "en",
	website: "",
	filledMs: 9000,
	token: "t",
};

describe("parseSubmission", () => {
	it("reads a good booking", () => {
		expect(parseSubmission(good)).toEqual({
			outcome: "ok",
			submission: {
				name: "Salma B.",
				phone: "06 61 28 64 64",
				kind: "card",
				choiceKey: "start-to-align",
				choiceLabel: "Start To Align (1 500 Dh)",
				message: "first time",
				lang: "en",
				token: "t",
			},
		});
	});

	it("reads a slot as a class", () => {
		expect(parseSubmission({ ...good, choiceKey: "slot:8h30" })).toMatchObject({
			submission: { kind: "class", choiceKey: "8h30" },
		});
	});

	it("reads no choice as other", () => {
		expect(parseSubmission({ ...good, choiceKey: "" })).toMatchObject({
			submission: { kind: "other", choiceKey: null },
		});
	});

	it("keeps an empty message as none", () => {
		expect(parseSubmission({ ...good, message: "   " })).toMatchObject({ submission: { message: null } });
	});

	it("treats a filled honeypot as a bot", () => {
		expect(parseSubmission({ ...good, website: "x" })).toEqual({ outcome: "bot" });
	});

	it.each([undefined, 100, 2499, 7 * 24 * 3600 * 1000 + 1])("treats fill time %s as a bot", (filledMs) => {
		expect(parseSubmission({ ...good, filledMs })).toEqual({ outcome: "bot" });
	});

	it("treats a body that isn't an object as a bot", () => {
		expect(parseSubmission("hello")).toEqual({ outcome: "bot" });
		expect(parseSubmission(null)).toEqual({ outcome: "bot" });
	});

	it("refuses a short name and a short phone", () => {
		expect(parseSubmission({ ...good, name: " S ", phone: "12 34" })).toEqual({
			outcome: "invalid",
			fields: { name: "too_short", phone: "invalid" },
		});
	});

	it("clips long fields", () => {
		const result = parseSubmission({ ...good, message: "a".repeat(3000), name: "b".repeat(200) });
		expect(result.outcome).toBe("ok");
		if (result.outcome !== "ok") return;
		expect(result.submission.message).toHaveLength(2000);
		expect(result.submission.name).toHaveLength(120);
	});

	it("falls back to French", () => {
		expect(parseSubmission({ ...good, lang: "de" })).toMatchObject({ submission: { lang: "fr" } });
	});

	it("labels a booking with no choice text", () => {
		expect(parseSubmission({ ...good, choice: "" })).toMatchObject({ submission: { choiceLabel: "—" } });
	});

	it("drops a token that is too long", () => {
		expect(parseSubmission({ ...good, token: "x".repeat(2049) })).toMatchObject({ submission: { token: "" } });
	});
});

describe("newRequestRef", () => {
	it("makes refs like WEB-1A2B3C4D", () => {
		expect(newRequestRef()).toMatch(/^WEB-[0-9A-F]{8}$/);
	});
});

describe("findDuplicate", () => {
	const now = new Date("2026-06-10T10:00:00Z");
	const first = {
		phone: "+212661286464",
		choiceLabel: "Start To Align (1 500 Dh)",
		createdAt: new Date("2026-06-10T09:55:00Z"),
	};

	it("finds the same booking sent again within 10 minutes", () => {
		expect(findDuplicate([first], { phone: "06 61 28 64 64", choiceLabel: first.choiceLabel }, now)).toBe(first);
	});

	it("lets the same booking through after 10 minutes", () => {
		const older = { ...first, createdAt: new Date("2026-06-10T09:49:00Z") };
		expect(findDuplicate([older], { phone: "0661286464", choiceLabel: first.choiceLabel }, now)).toBeNull();
	});

	it("lets another choice through", () => {
		expect(findDuplicate([first], { phone: "0661286464", choiceLabel: "Graceful Reset (2 600 Dh)" }, now)).toBeNull();
	});
});
