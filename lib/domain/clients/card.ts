// What a client card says at a glance. Kept apart from the component so the
// rules are tested and the same everywhere the card appears.

import { cardState, expiredCards } from "@/lib/domain/clients/membership-sale";
import { formatDay, STUDIO_TIME_ZONE, studioDateString } from "@/lib/utils/time";

export type CreditsTone = "ok" | "low" | "none" | "expired";

/** Two or fewer credits left is worth noticing at the door. */
export const LOW_CREDITS = 2;

type WalletCard = Parameters<typeof cardState>[0] & { product?: { credits: number | null } | null };

/**
 * The credits a client can use on `today` (a studio day), across their
 * cards, out of the card's total when there's one card. An expired card's
 * credits can't be used: with nothing else to pay, it says the card
 * expired, and when. `endsOn` is the last day they can come, when every
 * card they can use has an end.
 */
export function creditsSummary(
	wallets: WalletCard[] | null | undefined,
	today: string = studioDateString(),
): { count: number | null; total: number | null; tone: CreditsTone; expiredOn?: string; endsOn?: string } {
	// A cancelled sale is no card at all.
	const cards = (wallets ?? []).filter((card) => card.status !== "cancelled");
	if (!cards.length) return { count: null, total: null, tone: "none" };
	const usable = cards.filter((card) => cardState(card, today) === "active");
	if (usable.length) {
		const count = usable.reduce((sum, card) => sum + card.remainingCredits, 0);
		const total = usable.length === 1 ? (usable[0].product?.credits ?? null) : null;
		const summary = { count, total, tone: count <= LOW_CREDITS ? ("low" as const) : ("ok" as const) };
		const ends = usable.map((card) => card.expiresOn);
		return ends.every(Boolean) ? { ...summary, endsOn: ends.sort().at(-1)! } : summary;
	}
	const [expired] = expiredCards(cards, today);
	if (expired?.expiresOn) return { count: 0, total: null, tone: "expired", expiredOn: expired.expiresOn };
	return { count: 0, total: cards[0].product?.credits ?? null, tone: "low" };
}

/** A card's day, short: "30 Nov"; with the year when it isn't this one ("30 Nov 2025"). */
export function shortDay(date: string, today: string = studioDateString()) {
	const sameYear = date.slice(0, 4) === today.slice(0, 4);
	return formatDay(date, sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
}

// Dates are read in the studio's calendar, assembled from parts so the text
// doesn't depend on a browser's punctuation ("Tue 27 Oct", "6 Jan 2024").
const dateParts = new Intl.DateTimeFormat("en-GB", {
	timeZone: STUDIO_TIME_ZONE,
	weekday: "short",
	day: "numeric",
	month: "short",
	year: "numeric",
});
const partsOf = (instant: Date) =>
	Object.fromEntries(dateParts.formatToParts(instant).map(({ type, value }) => [type, value]));

/** When the client last came: "Today", "Yesterday", "Tue 27 Oct", or "30 Dec 2025" for another year. */
export function lastVisitLabel(lastCheckIn: Date | string | null | undefined, now: Date = new Date()): string {
	if (!lastCheckIn) return "Not yet";
	const visit = new Date(lastCheckIn);
	const day = studioDateString(visit);
	if (day === studioDateString(now)) return "Today";
	if (day === studioDateString(new Date(now.getTime() - 86_400_000))) return "Yesterday";
	const p = partsOf(visit);
	return p.year === partsOf(now).year ? `${p.weekday} ${p.day} ${p.month}` : `${p.day} ${p.month} ${p.year}`;
}

type Alert = { condition: string; severity: "info" | "warning" | "critical"; startDate: string };

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 } as const;

/** Critical first, then warnings, then notes; the newest first within each. */
export function sortAlerts<T extends Alert>(alerts: T[]): T[] {
	return [...alerts].sort(
		(a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.startDate.localeCompare(a.startDate),
	);
}

/** The alerts as one line for a toast: "Knee surgery (critical), Asthma". */
export function alertsSummary(alerts: Alert[]): string {
	return sortAlerts(alerts)
		.map((a) => (a.severity === "critical" ? `${a.condition} (critical)` : a.condition))
		.join(", ");
}

/** The alert chip on the card: the most important condition, and how many more ("Knee surgery +2"). */
export function alertChipLabel(alerts: Alert[]): string {
	const [first, ...rest] = sortAlerts(alerts);
	return rest.length ? `${first.condition} +${rest.length}` : first.condition;
}
