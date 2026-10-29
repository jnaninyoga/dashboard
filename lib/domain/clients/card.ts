// What a client card says at a glance. Kept apart from the component so the
// rules are tested and the same everywhere the card appears.

import { STUDIO_TIME_ZONE, studioDateString } from "@/lib/utils/time";

export type CreditsTone = "ok" | "low" | "none";

/** Two or fewer credits left is worth noticing at the door. */
const LOW_CREDITS = 2;

/** Credits left on the client's active membership card, out of the card's total. */
export function creditsSummary(
	wallet: { remainingCredits: number; product?: { defaultCredits: number } | null } | null | undefined,
): { count: number | null; total: number | null; tone: CreditsTone } {
	if (!wallet) return { count: null, total: null, tone: "none" };
	const count = Math.max(0, wallet.remainingCredits);
	return { count, total: wallet.product?.defaultCredits ?? null, tone: count <= LOW_CREDITS ? "low" : "ok" };
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
