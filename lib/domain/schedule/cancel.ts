// What cancelling a session gives back. Kept apart from the action so the
// rules are tested on their own: one credit per check-in that took one, on
// the card it came from, and never twice.

import { type ClientWallet, type slotTypeEnum } from "@/services/database/schema";

type SlotType = (typeof slotTypeEnum.enumValues)[number];

/** Credits to give back, per card (wallet id → credits). */
export function refundsFor(
	checkIns: { walletId: string; slotType: SlotType; cancelledAt: Date | null }[],
): Map<string, number> {
	const refunds = new Map<string, number>();
	for (const checkIn of checkIns) {
		// Already given back, or an outdoor session (no credit was taken).
		if (checkIn.cancelledAt || checkIn.slotType === "outdoor") continue;
		refunds.set(checkIn.walletId, (refunds.get(checkIn.walletId) ?? 0) + 1);
	}
	return refunds;
}

/**
 * A card after its credits come back. An empty card is usable again; an
 * expired or cancelled one keeps its status (her call), with the credits counted.
 */
export function walletAfterRefund(
	wallet: Pick<ClientWallet, "remainingCredits" | "status">,
	credits: number,
): Pick<ClientWallet, "remainingCredits" | "status"> {
	return {
		remainingCredits: wallet.remainingCredits + credits,
		status: wallet.status === "empty" ? "active" : wallet.status,
	};
}
