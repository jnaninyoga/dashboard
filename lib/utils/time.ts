// The studio runs on Marrakech time whatever the server's clock says.
// Morocco's offset changes by decree (Ramadan; UTC+1 → UTC+0 on 20 Sep 2026),
// so always go through the zone database, never a fixed offset, and keep
// Node current: its bundled tz data decides what "now in Marrakech" is.
export const STUDIO_TIME_ZONE = "Africa/Casablanca";

const wallClockParts = new Intl.DateTimeFormat("en-US", {
	timeZone: STUDIO_TIME_ZONE,
	year: "numeric",
	month: "numeric",
	day: "numeric",
	hour: "numeric",
	minute: "numeric",
	second: "numeric",
	hourCycle: "h23",
});

/**
 * The studio's wall-clock time as a Date whose local fields (getHours,
 * getDate…) read as Marrakech time. Use it for display and day logic only,
 * never to store or compare instants.
 */
export function toStudioTime(instant: Date = new Date()): Date {
	const p = Object.fromEntries(
		wallClockParts
			.formatToParts(instant)
			.map(({ type, value }) => [type, Number(value)]),
	);
	return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

export type DayPeriod = "morning" | "afternoon" | "evening" | "night";

export function getDayPeriod(studioTime: Date): DayPeriod {
	const hour = studioTime.getHours();
	if (hour >= 5 && hour < 12) return "morning";
	if (hour >= 12 && hour < 18) return "afternoon";
	if (hour >= 18 && hour < 22) return "evening";
	return "night";
}
