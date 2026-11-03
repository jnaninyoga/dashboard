// Which clients to ask about a new card, and why: the list on Home, and the
// WhatsApp message that goes with each. Kept apart from the screen so the
// rules are tested.

import { addDays, studioDateString } from "@/lib/utils/time";

import { LOW_CREDITS } from "./card";
import { cardForCheckIn, cardState } from "./membership-sale";

/** A card ending within this many days is worth a word. */
export const RENEW_WITHIN_DAYS = 7;
/**
 * A card that ended, or was last used, this many days ago still calls for a
 * word; before that, the client has moved on and the list would only grow.
 */
export const LAPSED_WITHIN_DAYS = 30;

type Card = {
	status: string;
	remainingCredits: number;
	expiresOn?: string | null;
	activatedAt?: Date | string | null;
	lastUsedAt?: Date | string | null;
	product?: { name: string } | null;
};

export type Renewal =
	/** Their cards end on `day` (`credits` still to use by then). */
	| { reason: "ends"; day: string; credits: number; card: string | null }
	/** Two or fewer credits left. */
	| { reason: "low"; credits: number; card: string | null }
	/** Their card ended on `day` with `credits` unused, and nothing else pays. */
	| { reason: "expired"; day: string; credits: number; card: string | null }
	/** Their card's last credit went on `day`, and nothing else pays. */
	| { reason: "used-up"; day: string; card: string | null };

/** The membership it was sold as; none for cards from before the price list. */
const nameOf = (card: Card) => card.product?.name ?? null;
const dayOf = (instant: Date | string) => studioDateString(new Date(instant));
const lastActive = (card: Card) => card.lastUsedAt ?? card.activatedAt;

/**
 * Whether a client needs a new card soon, from all their cards, on `today`
 * (a studio day). With credits to use: when every card they can use ends
 * within a week, or when two or fewer credits are left and they still come.
 * With none: when their last card ended or was used up in the last month.
 */
export function renewalFor(cards: Card[], today: string): Renewal | null {
	const open = cards.filter((card) => card.status !== "cancelled");
	const usable = open.filter((card) => cardState(card, today) === "active");
	const since = addDays(today, -LAPSED_WITHIN_DAYS);

	if (usable.length) {
		const credits = usable.reduce((sum, card) => sum + card.remainingCredits, 0);
		// They can come until the last of their cards ends; a card without an end keeps them going.
		const last = usable.every((card) => card.expiresOn)
			? usable.reduce((a, b) => (a.expiresOn! >= b.expiresOn! ? a : b))
			: null;
		if (last && last.expiresOn! <= addDays(today, RENEW_WITHIN_DAYS)) {
			return { reason: "ends", day: last.expiresOn!, credits, card: nameOf(last) };
		}
		const paying = cardForCheckIn(usable, today)!;
		const active = usable.map(lastActive).filter((at) => at && dayOf(at) >= since);
		return credits <= LOW_CREDITS && active.length ? { reason: "low", credits, card: nameOf(paying) } : null;
	}

	const latest = [...open].sort((a, b) => new Date(b.activatedAt ?? 0).getTime() - new Date(a.activatedAt ?? 0).getTime())[0];
	if (!latest) return null;
	const state = cardState(latest, today);
	if (state === "expired" && latest.expiresOn! >= since) {
		return { reason: "expired", day: latest.expiresOn!, credits: latest.remainingCredits, card: nameOf(latest) };
	}
	const usedUp = state === "empty" ? lastActive(latest) : null;
	if (usedUp && dayOf(usedUp) >= since) return { reason: "used-up", day: dayOf(usedUp), card: nameOf(latest) };
	return null;
}

const RANK: Record<Renewal["reason"], number> = { expired: 0, "used-up": 0, ends: 1, low: 2 };

/**
 * Most pressing first: those who can't come in any more (the latest first),
 * then cards ending (the soonest first), then credits running out (the
 * fewest first).
 */
export function byUrgency(a: Renewal, b: Renewal): number {
	return (
		RANK[a.reason] - RANK[b.reason] ||
		(a.reason === "ends" && b.reason === "ends" ? a.day.localeCompare(b.day) : 0) ||
		(a.reason === "low" && b.reason === "low" ? a.credits - b.credits : 0) ||
		("day" in a && "day" in b && a.reason !== "ends" ? b.day.localeCompare(a.day) : 0)
	);
}

const credits = (n: number) => `${n} ${n === 1 ? "credit" : "credits"}`;

/** Why they're on the list, for her: "Ends Fri 6 Nov, 3 credits to use". */
export function renewalLine(renewal: Renewal, today: string, day: (date: string) => string): string {
	switch (renewal.reason) {
		case "ends":
			return `Ends ${renewal.day === today ? "today" : day(renewal.day)}, ${credits(renewal.credits)} to use`;
		case "low":
			return `${credits(renewal.credits)} left`;
		case "expired":
			return renewal.credits
				? `Expired ${day(renewal.day)}, ${renewal.credits} unused`
				: `Expired ${day(renewal.day)}`;
		case "used-up":
			return `Used up ${renewal.day === today ? "today" : day(renewal.day)}`;
	}
}

// French typography: a no-break space inside « » and a narrow one before "?".
const yourCard = (card: string | null) => (card ? `votre carte « ${card} »` : "votre carte");
const ASK = " ?";
const frDay = (date: string) =>
	new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
		new Date(`${date}T12:00:00Z`),
	);
const sessions = (n: number) => (n === 1 ? "une séance" : `${n} séances`);

/**
 * The message she sends the client on WhatsApp, in French like her
 * documents: what's happening to their card, and whether they'd like a new
 * one, signed with her name.
 */
export function renewalMessage(renewal: Renewal, client: { fullName: string }, today: string, signature: string): string {
	const hello = `Bonjour ${client.fullName.trim().split(/\s+/)[0]},`;
	const card = yourCard(renewal.card);
	const body = (() => {
		switch (renewal.reason) {
			case "ends":
				return `${card} se termine ${renewal.day === today ? "aujourd’hui" : `le ${frDay(renewal.day)}`} et il vous reste ${sessions(renewal.credits)} à utiliser d’ici là. Souhaitez-vous la renouveler${ASK}`;
			case "low":
				return `il vous reste ${sessions(renewal.credits)} sur ${card}. Souhaitez-vous la renouveler${ASK}`;
			case "expired":
				return `${card} a pris fin le ${frDay(renewal.day)}. Souhaitez-vous en reprendre une${ASK}`;
			case "used-up":
				return `vous avez utilisé toutes les séances de ${card}. Souhaitez-vous en reprendre une${ASK}`;
		}
	})();
	return `${hello} ${body}\n\nÀ bientôt,\n${signature}`;
}
