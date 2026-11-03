// A client's health notes as she reads them before class: what to watch for
// now (alerts), what's good to know (notes), and what's behind them
// (resolved). Kept apart from the screen so the rules are tested.

type Note = {
	severity: "info" | "warning" | "critical";
	isAlert: boolean;
	startDate: string;
	endDate?: string | null;
};

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 } as const;

/** A warning or critical note is an alert (shown at check-in); a note for information isn't. */
export const isAlertSeverity = (severity: Note["severity"]) => severity !== "info";

/**
 * The notes in three groups: alerts still open (critical first, then the
 * newest), other open notes (newest first), and resolved ones (the latest
 * resolved first). A note is resolved once it has an end date, or when an
 * alert was switched off before end dates were kept.
 */
export function healthPicture<T extends Note>(notes: T[]): { alerts: T[]; notes: T[]; resolved: T[] } {
	const resolved = (note: T) => !!note.endDate || (isAlertSeverity(note.severity) && !note.isAlert);
	const open = notes.filter((note) => !resolved(note));
	return {
		alerts: open
			.filter((note) => note.isAlert)
			.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.startDate.localeCompare(a.startDate)),
		notes: open.filter((note) => !note.isAlert).sort((a, b) => b.startDate.localeCompare(a.startDate)),
		resolved: notes
			.filter(resolved)
			.sort((a, b) => (b.endDate ?? b.startDate).localeCompare(a.endDate ?? a.startDate)),
	};
}

/** Age in whole years on `today` (both "YYYY-MM-DD"). */
export function ageOn(birthDate: string, today: string): number {
	const [by, bm, bd] = birthDate.split("-").map(Number);
	const [ty, tm, td] = today.split("-").map(Number);
	return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}
