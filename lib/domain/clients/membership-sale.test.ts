import { addMonths } from "@/lib/utils/time";

import { describe, expect, it } from "vitest";

import { cardExpiry, cardForCheckIn, cardState, checkInRefusal, expiredCards, priceAfterDiscount } from "./membership-sale";

describe("priceAfterDiscount", () => {
	it("takes a percentage off her price, to the centime", () => {
		expect(priceAfterDiscount("500.50", { name: "Senior", discountType: "percentage", discountValue: "12.5" })).toEqual({
			list: 500.5,
			off: 62.56,
			price: 437.94,
		});
	});

	it("takes a fixed amount off, never below nothing", () => {
		expect(priceAfterDiscount(400, { name: "Ami", discountType: "fixed", discountValue: 50 })).toEqual({ list: 400, off: 50, price: 350 });
		expect(priceAfterDiscount(40, { name: "Ami", discountType: "fixed", discountValue: 50 })).toEqual({ list: 40, off: 40, price: 0 });
	});

	it("charges her price without a discount", () => {
		expect(priceAfterDiscount(400, null)).toEqual({ list: 400, off: 0, price: 400 });
	});
});

describe("expiry", () => {
	it("ends the same day, months later (or the month's last day)", () => {
		expect(cardExpiry("2026-10-30", 1)).toBe("2026-11-30");
		expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
		expect(addMonths("2026-11-15", 3)).toBe("2027-02-15");
		expect(cardExpiry("2026-10-30", null)).toBeNull();
	});
});

describe("cards at the door", () => {
	const card = (id: string, credits: number, expiresOn: string | null, status = "active", activatedAt = "2026-10-01") => ({
		id,
		name: `Pass ${id}`,
		status,
		remainingCredits: credits,
		expiresOn,
		activatedAt,
	});

	it("is usable until its last day, then expired while it has credits", () => {
		expect(cardState(card("a", 4, "2026-11-30"), "2026-11-30")).toBe("active");
		expect(cardState(card("a", 4, "2026-11-30"), "2026-12-01")).toBe("expired");
		expect(cardState(card("a", 0, "2026-11-30"), "2026-12-01")).toBe("empty");
		expect(cardState(card("a", 4, null), "2030-01-01")).toBe("active");
		expect(cardState(card("a", 4, null, "cancelled"), "2026-10-01")).toBe("cancelled");
	});

	it("spends the card that expires first, then cards without an end", () => {
		const cards = [card("later", 5, "2026-12-30"), card("open", 5, null, "active", "2026-01-01"), card("soon", 2, "2026-11-10")];
		expect(cardForCheckIn(cards, "2026-11-01")?.id).toBe("soon");
		expect(cardForCheckIn(cards, "2026-11-20")?.id).toBe("later");
		expect(cardForCheckIn([card("open", 5, null)], "2026-11-20")?.id).toBe("open");
	});

	it("says why a client can't be checked in, naming an expired card", () => {
		const day = (d: string) => d.split("-").reverse().join("/");
		expect(checkInRefusal([card("A", 4, "2026-11-30")], "2026-12-02", day)).toBe(
			"Card expired: Pass A ended on 30/11/2026 with 4 credits left. Sell a new membership to check them in.",
		);
		expect(checkInRefusal([card("A", 0, "2026-11-30")], "2026-12-02", day)).toBe("No credits left. Sell a new membership to check them in.");
		expect(checkInRefusal([], "2026-12-02", day)).toBe("No membership card yet. Sell one to check them in.");
		expect(checkInRefusal([card("A", 4, "2026-11-30"), card("B", 1, null)], "2026-12-02", day)).toBeNull();
		expect(expiredCards([card("A", 4, "2026-11-30"), card("B", 3, "2026-11-25")], "2026-12-02").map((c) => c.id)).toEqual(["A", "B"]);
	});
});
