// What a client card says at a glance. Kept apart from the component so the
// rules are tested and the same everywhere the card appears.

export type CreditsTone = "ok" | "low" | "none";

/** Two or fewer credits left is worth noticing at the door. */
const LOW_CREDITS = 2;

/** The card's credits line, from the client's active membership card. */
export function creditsLine(wallet: { remainingCredits: number } | null | undefined): { text: string; tone: CreditsTone } {
	if (!wallet) return { text: "No active card", tone: "none" };
	const left = wallet.remainingCredits;
	if (left <= 0) return { text: "No credits left", tone: "low" };
	return { text: `${left} ${left === 1 ? "credit" : "credits"} left`, tone: left <= LOW_CREDITS ? "low" : "ok" };
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
