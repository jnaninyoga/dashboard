import { describe, expect, it } from "vitest";

import {
	canTake,
	capacityProblem,
	englishMissing,
	eventPhase,
	eventProblems,
	googleTranslateUrl,
	places,
	siteEvents,
	slugify,
	uniqueSlug,
} from "./rules";

describe("slugify", () => {
	it("turns a French title into an address", () => {
		expect(slugify("Lever de soleil à la Palmeraie !")).toBe("lever-de-soleil-a-la-palmeraie");
		expect(slugify("  Yoga & Méditation — l'Atlas  ")).toBe("yoga-meditation-l-atlas");
	});

	it("never gives an empty address", () => {
		expect(slugify("!!!")).toBe("evenement");
	});

	it("keeps addresses short", () => {
		expect(slugify("a".repeat(100)).length).toBeLessThanOrEqual(60);
	});
});

describe("uniqueSlug", () => {
	it("adds a number when the address is taken", () => {
		expect(uniqueSlug("palmeraie", [])).toBe("palmeraie");
		expect(uniqueSlug("palmeraie", ["palmeraie"])).toBe("palmeraie-2");
		expect(uniqueSlug("palmeraie", ["palmeraie", "palmeraie-2"])).toBe("palmeraie-3");
	});
});

describe("places", () => {
	it("counts people, not reservations, against the limit", () => {
		expect(places(12, 9)).toEqual({ capacity: 12, confirmed: 9, left: 3, full: false });
		expect(places(12, 12)).toEqual({ capacity: 12, confirmed: 12, left: 0, full: true });
	});

	it("has no count without a limit", () => {
		expect(places(null, 30)).toEqual({ capacity: null, confirmed: 30, left: null, full: false });
	});
});

describe("canTake", () => {
	it("takes a group only when all of it fits", () => {
		expect(canTake(12, 9, 3)).toBe(true);
		expect(canTake(12, 10, 3)).toBe(false);
		expect(canTake(null, 500, 10)).toBe(true);
	});
});

describe("capacityProblem", () => {
	it("refuses a limit under the places already confirmed", () => {
		expect(capacityProblem(8, 10)).toBe("10 places are already confirmed: the limit can't go under 10.");
		expect(capacityProblem(10, 10)).toBeNull();
		expect(capacityProblem(null, 10)).toBeNull();
	});
});

describe("eventProblems", () => {
	const good = {
		titleFr: "Lever de soleil",
		descriptionFr: "Une heure de pratique.",
		startsAt: new Date("2026-06-20T06:00:00Z"),
		endsAt: new Date("2026-06-20T08:00:00Z"),
		placeName: "Palmeraie",
		price: 250,
		capacity: 12,
	};

	it("accepts a complete event", () => {
		expect(eventProblems(good)).toEqual([]);
	});

	it("names what's missing or wrong", () => {
		expect(
			eventProblems({ ...good, titleFr: " ", descriptionFr: "", placeName: "", endsAt: good.startsAt, price: -1, capacity: 0 }),
		).toEqual([
			"Give it a French title",
			"Write the French description",
			"Say where it happens",
			"It has to end after it starts",
			"The price can't be negative",
			"At least 1 place, or no limit",
		]);
	});

	it("lets an event last several days", () => {
		expect(eventProblems({ ...good, endsAt: new Date("2026-06-22T16:00:00Z") })).toEqual([]);
	});
});

describe("englishMissing", () => {
	it("flags each English field left empty", () => {
		expect(englishMissing({ titleEn: "", descriptionEn: "  " })).toEqual({ title: true, description: true });
		expect(englishMissing({ titleEn: "Sunrise", descriptionEn: "One hour." })).toEqual({ title: false, description: false });
	});
});

describe("googleTranslateUrl", () => {
	it("opens Google Translate from French to English with her text", () => {
		expect(googleTranslateUrl("Lever de soleil & thé")).toBe(
			"https://translate.google.com/?sl=fr&tl=en&op=translate&text=Lever%20de%20soleil%20%26%20th%C3%A9",
		);
	});
});

describe("eventPhase", () => {
	const event = { status: "published" as const, startsAt: new Date("2026-06-20T06:00:00Z"), endsAt: new Date("2026-06-21T18:00:00Z") };

	it("follows the event through its days", () => {
		expect(eventPhase(event, new Date("2026-06-19T10:00:00Z"))).toBe("upcoming");
		expect(eventPhase(event, new Date("2026-06-20T10:00:00Z"))).toBe("ongoing");
		expect(eventPhase(event, new Date("2026-06-22T10:00:00Z"))).toBe("past");
	});

	it("says cancelled and draft whatever the date", () => {
		expect(eventPhase({ ...event, status: "cancelled" }, new Date("2026-06-19T10:00:00Z"))).toBe("cancelled");
		expect(eventPhase({ ...event, status: "draft" }, new Date("2026-06-19T10:00:00Z"))).toBe("draft");
	});
});

describe("siteEvents", () => {
	const base = {
		slug: "a",
		titleFr: "A",
		titleEn: null,
		descriptionFr: "Texte",
		descriptionEn: null,
		startsAt: new Date("2026-06-20T06:00:00Z"),
		endsAt: new Date("2026-06-20T08:00:00Z"),
		placeName: "Palmeraie",
		placeMapsUrl: null,
		price: "250.00",
		capacity: 12,
		status: "published" as const,
		publishedAt: new Date("2026-06-01T00:00:00Z"),
		photoUpdatedAt: null as Date | null,
	};

	it("has no photo version without a photo", () => {
		expect(siteEvents([base])[0]).toMatchObject({ photo: false, photoVersion: null });
	});

	it("shows published and cancelled events, never drafts, soonest first", () => {
		const list = siteEvents([
			{ ...base, slug: "later", startsAt: new Date("2026-07-01T06:00:00Z"), endsAt: new Date("2026-07-01T08:00:00Z") },
			{ ...base, slug: "draft", status: "draft" as const, publishedAt: null },
			{ ...base, slug: "soon" },
			{ ...base, slug: "off", status: "cancelled" as const },
		]);
		expect(list.map((e) => e.slug)).toEqual(["soon", "off", "later"]);
	});

	it("gives the site what it needs, in both languages, with numbers", () => {
		const [event] = siteEvents([{ ...base, titleEn: "Sunrise", photoUpdatedAt: new Date("2026-06-02T10:00:00Z") }]);
		expect(event).toEqual({
			slug: "a",
			title: { fr: "A", en: "Sunrise" },
			description: { fr: "Texte", en: null },
			startsAt: "2026-06-20T06:00:00.000Z",
			endsAt: "2026-06-20T08:00:00.000Z",
			place: "Palmeraie",
			mapsUrl: null,
			price: 250,
			capacity: 12,
			status: "published",
			photo: true,
			// A new photo gets a new address, so caches never keep the old one.
			photoVersion: Date.parse("2026-06-02T10:00:00Z"),
		});
	});
});
