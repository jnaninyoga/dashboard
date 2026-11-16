import { describe, expect, it } from "vitest";

import { isSiteKey, siteCards, sitePayload } from "./cards";
import { DEFAULT_CLASS_TIMES } from "./timetable";

const product = (over: Partial<Parameters<typeof siteCards>[0][number]> = {}) => ({
	kind: "membership" as const,
	name: "Start To Align",
	price: "1500.00",
	credits: 10,
	durationMonths: 3,
	siteKey: "start-to-align",
	onSite: true,
	sitePosition: 2,
	popular: false,
	isArchived: false,
	...over,
});

describe("siteCards", () => {
	it("gives the site's cards in her order, with numbers", () => {
		const cards = siteCards([
			product(),
			product({ name: "One session", price: "200.00", credits: 1, durationMonths: 1, siteKey: "seance", sitePosition: 1, popular: true }),
		]);
		expect(cards).toEqual([
			{ key: "seance", name: "One session", credits: 1, months: 1, price: 200, popular: true },
			{ key: "start-to-align", name: "Start To Align", credits: 10, months: 3, price: 1500, popular: false },
		]);
	});

	it("orders cards in the same place by price", () => {
		const cards = siteCards([product({ siteKey: "b", price: "900.00", sitePosition: 0 }), product({ siteKey: "a", price: "300.00", sitePosition: 0 })]);
		expect(cards.map((c) => c.key)).toEqual(["a", "b"]);
	});

	it("leaves out cards off the site, archived, without a key, and partner rates", () => {
		expect(
			siteCards([
				product({ onSite: false }),
				product({ isArchived: true }),
				product({ siteKey: null }),
				product({ kind: "partner_service" as never }),
			]),
		).toEqual([]);
	});
});

describe("isSiteKey", () => {
	it("accepts the site's keys", () => {
		expect(["seance", "start-to-align", "elevate-and-evolve", "pass10"].every(isSiteKey)).toBe(true);
	});

	it("refuses anything that can't be part of a link", () => {
		expect(["", "Start To Align", "start--align", "-start", "start_align", "é", "a".repeat(41)].some(isSiteKey)).toBe(false);
	});
});

describe("sitePayload", () => {
	it("is what the website builds from, with no events yet", () => {
		const payload = sitePayload({ classTimes: DEFAULT_CLASS_TIMES, products: [product()], now: new Date("2026-06-10T10:00:00Z") });
		expect(payload).toMatchObject({
			version: 1,
			generatedAt: "2026-06-10T10:00:00.000Z",
			classTimes: { days: [1, 4], words: { en: { headline: "Mondays and Thursdays, six sessions." } } },
			cards: [{ key: "start-to-align", price: 1500 }],
			events: [],
		});
		expect(payload.classTimes.times).toHaveLength(6);
	});
});
