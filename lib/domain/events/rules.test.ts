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
		title: "Lever de soleil",
		onWebsite: true,
		descriptionFr: "Une heure de pratique.",
		startsAt: new Date("2026-06-20T06:00:00Z"),
		endsAt: new Date("2026-06-20T08:00:00Z"),
		placeName: "Palmeraie",
		price: 250,
		capacity: 12,
	};

	it("accepts a complete outdoor session", () => {
		expect(eventProblems(good)).toEqual([]);
	});

	it("names what's missing or wrong", () => {
		expect(eventProblems({ ...good, title: " ", endsAt: good.startsAt, price: -1, capacity: 0 })).toEqual([
			"Give it a title",
			"It has to end after it starts",
			"The price can't be negative",
			"At least 1 place, or no limit",
		]);
	});

	it("needs the French description and the place only to show on the website", () => {
		expect(eventProblems({ ...good, descriptionFr: "", placeName: "" })).toEqual([
			"Write the French description, or turn off Show on the website",
			"Say where it happens, or turn off Show on the website",
		]);
		expect(eventProblems({ ...good, onWebsite: false, descriptionFr: "", placeName: "" })).toEqual([]);
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
	const session = {
		status: "scheduled" as const,
		onWebsite: true,
		slug: "a",
		descriptionFr: "Texte",
		placeName: "Palmeraie",
		startsAt: new Date("2026-06-20T06:00:00Z"),
		endsAt: new Date("2026-06-20T08:00:00Z"),
	};

	it("follows the session through its day", () => {
		expect(eventPhase(session, new Date("2026-06-19T10:00:00Z"))).toBe("upcoming");
		expect(eventPhase(session, new Date("2026-06-20T07:00:00Z"))).toBe("ongoing");
		expect(eventPhase(session, new Date("2026-06-21T10:00:00Z"))).toBe("past");
	});

	it("says off the website when it's switched off or not written yet", () => {
		expect(eventPhase({ ...session, onWebsite: false }, new Date("2026-06-19T10:00:00Z"))).toBe("off");
		expect(eventPhase({ ...session, descriptionFr: null }, new Date("2026-06-19T10:00:00Z"))).toBe("off");
	});

	it("says cancelled whatever the date", () => {
		expect(eventPhase({ ...session, status: "cancelled" }, new Date("2026-06-19T10:00:00Z"))).toBe("cancelled");
	});
});

describe("siteEvents", () => {
	const base = {
		slug: "a" as string | null,
		title: "A",
		titleEn: null as string | null,
		descriptionFr: "Texte" as string | null,
		descriptionEn: null as string | null,
		startsAt: new Date("2026-06-20T06:00:00Z"),
		endsAt: new Date("2026-06-20T08:00:00Z"),
		placeName: "Palmeraie" as string | null,
		placeMapsUrl: null as string | null,
		price: "250.00" as string | null,
		capacity: 12 as number | null,
		status: "scheduled" as "scheduled" | "cancelled",
		onWebsite: true,
		publishedAt: new Date("2026-06-01T00:00:00Z") as Date | null,
		photoUpdatedAt: null as Date | null,
	};

	it("shows outdoor sessions on the website, and cancelled ones it showed; soonest first", () => {
		const list = siteEvents([
			{ ...base, slug: "later", startsAt: new Date("2026-07-01T06:00:00Z"), endsAt: new Date("2026-07-01T08:00:00Z") },
			{ ...base, slug: "off", onWebsite: false },
			{ ...base, slug: "unwritten", descriptionFr: null },
			{ ...base, slug: "never-shown", status: "cancelled", publishedAt: null },
			{ ...base, slug: "soon" },
			{ ...base, slug: "called-off", status: "cancelled" },
		]);
		expect(list.map((e) => e.slug)).toEqual(["soon", "called-off", "later"]);
	});

	it("has no photo version without a photo", () => {
		expect(siteEvents([base])[0]).toMatchObject({ photo: false, photoVersion: null });
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
			photoVersion: Date.parse("2026-06-02T10:00:00Z"),
		});
	});

	it("reads a cancelled session as cancelled", () => {
		expect(siteEvents([{ ...base, status: "cancelled" }])[0].status).toBe("cancelled");
	});
});
