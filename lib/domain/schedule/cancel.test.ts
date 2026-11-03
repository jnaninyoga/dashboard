import { describe, expect, it } from "vitest";

import { refundsFor, walletAfterRefund } from "./cancel";

const at = new Date("2026-10-29T10:00:00Z");

describe("refundsFor", () => {
	it("gives one credit back per check-in, on the card it came from", () => {
		const refunds = refundsFor([
			{ walletId: "card-a", slotType: "group", cancelledAt: null },
			{ walletId: "card-b", slotType: "private", cancelledAt: null },
			{ walletId: "card-a", slotType: "b2b", cancelledAt: null },
		]);
		expect(Object.fromEntries(refunds)).toEqual({ "card-a": 2, "card-b": 1 });
	});

	it("gives nothing back for outdoor sessions, which took no credit", () => {
		expect(refundsFor([{ walletId: "card-a", slotType: "outdoor", cancelledAt: null }]).size).toBe(0);
	});

	it("never refunds a check-in twice (cancelling again changes nothing)", () => {
		expect(refundsFor([{ walletId: "card-a", slotType: "group", cancelledAt: at }]).size).toBe(0);
	});
});

describe("walletAfterRefund", () => {
	it("adds the credits back", () => {
		expect(walletAfterRefund({ remainingCredits: 3, status: "active" }, 2)).toEqual({
			remainingCredits: 5,
			status: "active",
		});
	});

	it("makes an empty card usable again", () => {
		expect(walletAfterRefund({ remainingCredits: 0, status: "empty" }, 1)).toEqual({
			remainingCredits: 1,
			status: "active",
		});
	});

	it("keeps an expired or cancelled card as it is, with the credit counted", () => {
		expect(walletAfterRefund({ remainingCredits: 0, status: "expired" }, 1).status).toBe("expired");
		expect(walletAfterRefund({ remainingCredits: 2, status: "cancelled" }, 1)).toEqual({
			remainingCredits: 3,
			status: "cancelled",
		});
	});
});
