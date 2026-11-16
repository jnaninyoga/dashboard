import { DEFAULT_HOURS } from "@/lib/config/schedule";

import { describe, expect, it } from "vitest";

import { cardLines, isSiteKey, linesOf, SITE_LINES_BEFORE, siteCards, sitePayload } from "./cards";

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
	sitePointsFr: null as string[] | null,
	sitePointsEn: null as string[] | null,
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
			{ key: "seance", name: "One session", credits: 1, months: 1, price: 200, popular: true, lines: SITE_LINES_BEFORE.seance },
			{ key: "start-to-align", name: "Start To Align", credits: 10, months: 3, price: 1500, popular: false, lines: SITE_LINES_BEFORE["start-to-align"] },
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

describe("card lines", () => {
	it("keep what the site said for its key until she writes her own", () => {
		expect(linesOf({ siteKey: "graceful-reset", sitePointsFr: null, sitePointsEn: null }).fr).toEqual(["Plan adapté à vos progrès", "Suivi régulier"]);
		expect(linesOf({ siteKey: "new-card", sitePointsFr: null, sitePointsEn: null })).toEqual({ fr: [], en: null });
	});

	it("are hers once written, even none at all", () => {
		expect(linesOf({ siteKey: "seance", sitePointsFr: ["Le souffle"], sitePointsEn: ["Breath"] })).toEqual({ fr: ["Le souffle"], en: ["Breath"] });
		expect(linesOf({ siteKey: "seance", sitePointsFr: [], sitePointsEn: [] })).toEqual({ fr: [], en: null });
	});

	it("show the French lines in English until she writes English ones", () => {
		expect(linesOf({ siteKey: "seance", sitePointsFr: ["Le souffle"], sitePointsEn: [] }).en).toBeNull();
	});

	it("are read one per row, without the empty ones", () => {
		expect(cardLines("  Suivi régulier \r\n\n Plan adapté  \n")).toEqual(["Suivi régulier", "Plan adapté"]);
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
		const payload = sitePayload({ hours: DEFAULT_HOURS, products: [product()], now: new Date("2026-06-10T10:00:00Z") });
		expect(payload).toMatchObject({
			version: 1,
			generatedAt: "2026-06-10T10:00:00.000Z",
			hours: { groups: [{ days: [1, 4] }], words: { en: { headline: "Mondays and Thursdays, six sessions." } } },
			cards: [{ key: "start-to-align", price: 1500 }],
			events: [],
		});
		expect(payload.hours.groups[0].periods).toHaveLength(6);
	});
});

describe("sitePayload with events", () => {
	it("carries the events it's given", () => {
		const event = {
			slug: "lever-de-soleil",
			title: { fr: "Lever de soleil", en: null },
			description: { fr: "Une heure.", en: null },
			startsAt: "2026-06-20T06:00:00.000Z",
			endsAt: "2026-06-20T08:00:00.000Z",
			bookingClosesAt: "2026-06-20T03:00:00.000Z",
			place: "Palmeraie",
			mapsUrl: null,
			price: 250,
			capacity: 12,
			status: "published" as const,
			photo: false,
			photoVersion: null,
		};
		expect(sitePayload({ hours: DEFAULT_HOURS, products: [], events: [event], now: new Date("2026-06-10T10:00:00Z") }).events).toEqual([event]);
	});
});
