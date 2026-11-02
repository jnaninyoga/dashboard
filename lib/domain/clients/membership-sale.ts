// Selling a membership card to a client, and what the card is worth at the
// door afterwards. Shared by the sale (server), the sale sheet (preview),
// check-in (which card pays) and the alerts on the client's card and page.

import { addMonths } from "@/lib/utils/time";

type Amount = number | string;

export type DiscountTerms = {
	name: string;
	discountType: "percentage" | "fixed";
	discountValue: Amount;
} | null;

const cents = (n: Amount) => Math.round(Number(n) * 100);

/** Her price, what the client's discount takes off, and what's left to pay (never below 0). */
export function priceAfterDiscount(listPrice: Amount, discount: DiscountTerms): { list: number; off: number; price: number } {
	const list = cents(listPrice);
	const value = Number(discount?.discountValue ?? 0);
	const off = !discount || !(value > 0)
		? 0
		: Math.min(list, discount.discountType === "percentage" ? Math.round((list * value) / 100) : cents(value));
	return { list: list / 100, off: off / 100, price: (list - off) / 100 };
}

/** The last day a card sold on `soldOn` can be used: the same day, `months` later. No duration, no end. */
export function cardExpiry(soldOn: string, durationMonths: number | null | undefined): string | null {
	return durationMonths && durationMonths > 0 ? addMonths(soldOn, durationMonths) : null;
}

export type CardState = "active" | "empty" | "expired" | "cancelled";

type Card = { status: string; remainingCredits: number; expiresOn?: string | null };

/**
 * Where a card stands on `today` (a studio day): usable, used up, expired
 * (past its last day with credits left: they can't be used), or cancelled.
 */
export function cardState(card: Card, today: string): CardState {
	if (card.status === "cancelled") return "cancelled";
	if (card.status === "empty" || card.remainingCredits <= 0) return "empty";
	if (card.expiresOn && card.expiresOn < today) return "expired";
	return "active";
}

/**
 * The card a check-in takes its credit from: a usable one, the one that
 * expires soonest first (so no credit lapses while a newer card is spent),
 * then cards without an end, oldest first.
 */
export function cardForCheckIn<T extends Card & { activatedAt?: Date | string | null }>(cards: T[], today: string): T | null {
	const usable = cards.filter((card) => cardState(card, today) === "active");
	usable.sort((a, b) => {
		if (a.expiresOn && b.expiresOn) return a.expiresOn.localeCompare(b.expiresOn);
		if (a.expiresOn || b.expiresOn) return a.expiresOn ? -1 : 1;
		return new Date(a.activatedAt ?? 0).getTime() - new Date(b.activatedAt ?? 0).getTime();
	});
	return usable[0] ?? null;
}

/** Cards past their last day with credits left, the latest first: what to tell her about. */
export function expiredCards<T extends Card>(cards: T[], today: string): T[] {
	return cards
		.filter((card) => cardState(card, today) === "expired")
		.sort((a, b) => (b.expiresOn ?? "").localeCompare(a.expiresOn ?? ""));
}

/**
 * Why a client can't be checked in with a credit, in her words, or null if a
 * card can pay: an expired card is named with its last day and the credits
 * it held.
 */
export function checkInRefusal(
	cards: (Card & { name?: string | null })[],
	today: string,
	formatDay: (date: string) => string,
): string | null {
	if (cardForCheckIn(cards, today)) return null;
	const [expired] = expiredCards(cards, today);
	if (expired) {
		const credits = `${expired.remainingCredits} credit${expired.remainingCredits === 1 ? "" : "s"}`;
		return `Card expired: ${expired.name ?? "the membership"} ended on ${formatDay(expired.expiresOn!)} with ${credits} left. Sell a new membership to check them in.`;
	}
	return cards.length ? "No credits left. Sell a new membership to check them in." : "No membership card yet. Sell one to check them in.";
}

/**
 * The card row a sale writes: the membership's credits and last day, her
 * price then, the discount as it was given (kept even if she changes her
 * discounts later), the price she settled on, and how she was paid.
 */
export function saleRow(sale: {
	clientId: string;
	membership: { id: string; credits: number | null; durationMonths: number | null; price: Amount };
	discount: DiscountTerms;
	price: number;
	soldOn: string;
	soldAt: Date;
	paymentMethod: "transfer" | "cheque" | "cash" | "card";
	paymentReference?: string | null;
	physicalCardRef?: string | null;
}) {
	return {
		clientId: sale.clientId,
		productId: sale.membership.id,
		remainingCredits: sale.membership.credits ?? 0,
		status: "active" as const,
		listPrice: Number(sale.membership.price).toFixed(2),
		discountName: sale.discount?.name ?? null,
		discountType: sale.discount?.discountType ?? null,
		discountValue: sale.discount ? Number(sale.discount.discountValue).toFixed(2) : null,
		amountPaid: sale.price.toFixed(2),
		paymentMethod: sale.paymentMethod,
		paymentReference: sale.paymentReference || null,
		physicalCardRef: sale.physicalCardRef || null,
		expiresOn: cardExpiry(sale.soldOn, sale.membership.durationMonths),
		activatedAt: sale.soldAt,
	};
}
