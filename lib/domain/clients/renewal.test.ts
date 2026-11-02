import { describe, expect, it } from "vitest";

import { byUrgency, type Renewal, renewalFor, renewalLine, renewalMessage } from "./renewal";

const today = "2026-11-02";
const card = (
	remainingCredits: number,
	expiresOn: string | null,
	{ status = "active", activatedAt = "2026-10-05T10:00:00Z", lastUsedAt = "2026-10-30T10:00:00Z", name = "Carte 10" } = {},
) => ({ status, remainingCredits, expiresOn, activatedAt, lastUsedAt, product: { name } });

describe("renewalFor", () => {
	it("asks when every card they can use ends within a week", () => {
		expect(renewalFor([card(3, "2026-11-06")], today)).toEqual({ reason: "ends", day: "2026-11-06", credits: 3, card: "Carte 10" });
		expect(renewalFor([card(3, "2026-11-02")], today)?.reason).toBe("ends");
		expect(renewalFor([card(3, "2026-11-10")], today)).toBeNull();
		// Another card keeps them going.
		expect(renewalFor([card(3, "2026-11-06"), card(5, "2026-12-30", { name: "Carte 20" })], today)).toBeNull();
		expect(renewalFor([card(3, "2026-11-06"), card(5, null)], today)).toBeNull();
	});

	it("asks when two or fewer credits are left and they still come", () => {
		expect(renewalFor([card(2, null)], today)).toEqual({ reason: "low", credits: 2, card: "Carte 10" });
		expect(renewalFor([card(1, "2026-11-06")], today)?.reason).toBe("ends");
		expect(renewalFor([card(3, null)], today)).toBeNull();
		// Last seen two months ago: they've moved on.
		expect(renewalFor([card(1, null, { lastUsedAt: "2026-09-01T10:00:00Z", activatedAt: "2026-08-01T10:00:00Z" })], today)).toBeNull();
	});

	it("asks when their last card ended or was used up this past month", () => {
		expect(renewalFor([card(2, "2026-10-28")], today)).toEqual({ reason: "expired", day: "2026-10-28", credits: 2, card: "Carte 10" });
		expect(renewalFor([card(0, null, { status: "empty", lastUsedAt: "2026-10-31T18:00:00Z" })], today)).toEqual({
			reason: "used-up",
			day: "2026-10-31",
			card: "Carte 10",
		});
		expect(renewalFor([card(2, "2026-09-15")], today)).toBeNull();
		expect(renewalFor([card(0, null, { status: "empty", lastUsedAt: "2026-09-01T10:00:00Z" })], today)).toBeNull();
	});

	it("reads their latest card, and ignores a cancelled sale", () => {
		const usedUp = card(0, null, { status: "empty", activatedAt: "2026-10-20T10:00:00Z", lastUsedAt: "2026-10-31T10:00:00Z", name: "Carte 5" });
		expect(renewalFor([card(2, "2026-10-28"), usedUp], today)).toMatchObject({ reason: "used-up", card: "Carte 5" });
		expect(renewalFor([card(10, null, { status: "cancelled" })], today)).toBeNull();
		expect(renewalFor([card(10, null, { status: "cancelled" }), card(1, null)], today)?.reason).toBe("low");
		expect(renewalFor([], today)).toBeNull();
	});
});

describe("byUrgency", () => {
	it("puts who can't come first, then cards ending soonest, then the fewest credits", () => {
		const list: Renewal[] = [
			{ reason: "low", credits: 2, card: "A" },
			{ reason: "ends", day: "2026-11-08", credits: 4, card: "B" },
			{ reason: "low", credits: 1, card: "C" },
			{ reason: "expired", day: "2026-10-20", credits: 1, card: "D" },
			{ reason: "ends", day: "2026-11-03", credits: 1, card: "E" },
			{ reason: "used-up", day: "2026-11-01", card: "F" },
		];
		expect(list.sort(byUrgency).map((r) => r.card)).toEqual(["F", "D", "E", "B", "C", "A"]);
	});
});

describe("renewal wording", () => {
	const day = (d: string) => d.slice(5);

	it("says why, for her", () => {
		expect(renewalLine({ reason: "ends", day: "2026-11-06", credits: 3, card: "A" }, today, day)).toBe("Ends 11-06, 3 credits to use");
		expect(renewalLine({ reason: "ends", day: today, credits: 1, card: "A" }, today, day)).toBe("Ends today, 1 credit to use");
		expect(renewalLine({ reason: "low", credits: 1, card: "A" }, today, day)).toBe("1 credit left");
		expect(renewalLine({ reason: "expired", day: "2026-10-28", credits: 2, card: "A" }, today, day)).toBe("Expired 10-28, 2 unused");
		expect(renewalLine({ reason: "used-up", day: "2026-11-01", card: "A" }, today, day)).toBe("Used up 11-01");
	});

	it("writes the client a French message, signed", () => {
		const client = { fullName: "Salma  Bennani" };
		expect(renewalMessage({ reason: "ends", day: "2026-11-06", credits: 3, card: "Carte 10" }, client, today, "Ouarda")).toBe(
			"Bonjour Salma, votre carte « Carte 10 » se termine le vendredi 6 novembre et il vous reste 3 séances à utiliser d’ici là. Souhaitez-vous la renouveler ?\n\nÀ bientôt,\nOuarda",
		);
		expect(renewalMessage({ reason: "low", credits: 1, card: "Carte 10" }, client, today, "Ouarda")).toContain("il vous reste une séance sur votre carte");
		expect(renewalMessage({ reason: "used-up", day: "2026-11-01", card: "Carte 10" }, client, today, "Ouarda")).toContain(
			"vous avez utilisé toutes les séances de votre carte «\u00A0Carte 10\u00A0».",
		);
		// A card from before the price list has no name to give.
		expect(renewalMessage({ reason: "expired", day: "2026-10-28", credits: 2, card: null }, client, today, "Ouarda")).toContain(
			"Bonjour Salma, votre carte a pris fin le mercredi 28 octobre.",
		);
	});
});
