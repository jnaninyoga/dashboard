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
	const p = wallClock(instant);
	return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

function wallClock(instant: Date): Record<string, number> {
	return Object.fromEntries(
		wallClockParts.formatToParts(instant).map(({ type, value }) => [type, Number(value)]),
	);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** The studio's calendar day as "YYYY-MM-DD". */
export function studioDateString(instant: Date = new Date()): string {
	const t = toStudioTime(instant);
	return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

/** The studio's offset from UTC in minutes at that instant (60 in June 2026, 0 in Ramadan). */
export function studioOffsetMinutes(instant: Date): number {
	// Straight from the zone's parts to UTC: no detour through the process's
	// own time zone, which can skip or repeat an hour of its own.
	const p = wallClock(instant);
	const wallAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
	return Math.round((wallAsUtc - instant.getTime()) / 60_000);
}

/** The start of the current hour. Morocco's offsets are whole hours, so flooring in UTC floors the studio hour too. */
export function currentHourStart(now: Date = new Date()): Date {
	return new Date(Math.floor(now.getTime() / 3_600_000) * 3_600_000);
}

/**
 * The instant at which the studio's clock reads `date` ("YYYY-MM-DD") and
 * `time` ("HH:mm"), whatever zone the server or the phone is in.
 */
export function fromStudioTime(date: string, time: string): Date {
	const [year, month, day] = date.split("-").map(Number);
	const [hour, minute] = time.split(":").map(Number);
	const asUtc = Date.UTC(year, month - 1, day, hour, minute);
	// The offset can differ either side of a clock change: settle it twice.
	const first = new Date(asUtc - studioOffsetMinutes(new Date(asUtc)) * 60_000);
	return new Date(asUtc - studioOffsetMinutes(first) * 60_000);
}

/** The instant the studio's current day began (its own midnight, not the server's). */
export function studioDayStart(now: Date = new Date()): Date {
	return fromStudioTime(studioDateString(now), "00:00");
}

/** The instant the studio's current month began. */
export function studioMonthStart(now: Date = new Date()): Date {
	return fromStudioTime(`${studioDateString(now).slice(0, 8)}01`, "00:00");
}

/** RFC 3339 with the studio's offset, e.g. "2026-06-15T10:00:00+01:00". */
export function studioIsoString(date: string, time: string): string {
	const offset = studioOffsetMinutes(fromStudioTime(date, time));
	const sign = offset < 0 ? "-" : "+";
	const abs = Math.abs(offset);
	return `${date}T${time}:00${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** Day of the week (0 = Sunday) of a "YYYY-MM-DD" date. */
export function weekdayOf(date: string): number {
	const [year, month, day] = date.split("-").map(Number);
	return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export type DayPeriod = "morning" | "afternoon" | "evening" | "night";

export function getDayPeriod(studioTime: Date): DayPeriod {
	const hour = studioTime.getHours();
	if (hour >= 5 && hour < 12) return "morning";
	if (hour >= 12 && hour < 18) return "afternoon";
	if (hour >= 18 && hour < 22) return "evening";
	return "night";
}
