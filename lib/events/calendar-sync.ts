// Outdoor sessions kept in step with her Google Calendar. She may move,
// rename or delete one there rather than here; the website reads our row, so
// the row follows her calendar wherever the dashboard reads it (the Schedule,
// Home, the session's page) and once a day before the site rebuilds.
// A plain server module: none of this is an endpoint by itself.

import { after } from "next/server";

import { type CalendarCheck, calendarCheck } from "@/lib/domain/events/calendar";
import { isListed } from "@/lib/domain/events/rules";
import { type MissingSession } from "@/lib/domain/schedule/feed";
import { logServerError } from "@/lib/errors/server";
import { type CalendarEvent } from "@/lib/types";
import { requestSiteRebuild } from "@/lib/website/rebuild";
import { db } from "@/services/database";
import { accounts, type StudioSession, studioSessions } from "@/services/database/schema";
import { getEventById, getValidAccessToken, withGoogle } from "@/services/google";

import { and, eq, gt, gte, inArray, lt, or } from "drizzle-orm";

/** The website shows it, or showed it: a change to it needs a rebuild. */
const onSite = (row: StudioSession) => isListed(row) || !!row.publishedAt;

/** Rebuilds the website once the page has been sent: a deploy hook can take seconds. */
const rebuildAfter = () => after(() => requestSiteRebuild("a session changed in Google Calendar"));

/** Brings a row in line with its event: a moved or renamed session follows her calendar. A deleted one is only reported. */
async function followCalendar(row: StudioSession, event: CalendarEvent | null): Promise<CalendarCheck> {
	const check = calendarCheck(row, event);
	if (check.kind === "changed") {
		await db
			.update(studioSessions)
			.set(check.set)
			.where(and(eq(studioSessions.id, row.id), eq(studioSessions.status, "scheduled")));
	}
	return check;
}

/**
 * The outdoor sessions of a run of days, set against the events Google listed
 * for it. Moved or renamed ones follow her calendar; deleted ones come back,
 * to be shown as no longer in her calendar. A session that left the run, or
 * one Google can't be asked about right now, stays as it is. A failure here is
 * logged and never takes the page down: the next visit tries again.
 */
export async function syncOutdoorSessions(userId: string, events: CalendarEvent[], start: Date, end: Date): Promise<MissingSession[]> {
	let missing: MissingSession[] = [];
	let rebuild = false;
	try {
		const found = new Map<string, CalendarEvent | null>(events.flatMap((e) => (e.id ? [[e.id, e] as const] : [])));
		const rows = await db
			.select()
			.from(studioSessions)
			.where(
				and(
					eq(studioSessions.type, "outdoor"),
					eq(studioSessions.status, "scheduled"),
					or(
						and(gte(studioSessions.startsAt, start), lt(studioSessions.startsAt, end)),
						found.size ? inArray(studioSessions.googleEventId, [...found.keys()]) : undefined,
					),
				),
			);

		// Not in this run's list: moved out of it, or deleted. Google says which.
		const unseen = rows.filter((row) => !found.has(row.googleEventId));
		if (unseen.length) {
			const looked = await withGoogle(userId, "Google Calendar", (token) =>
				Promise.all(unseen.map((row) => getEventById(token, row.googleEventId))),
			);
			if (looked.error === undefined) unseen.forEach((row, i) => found.set(row.googleEventId, looked.data[i]));
		}

		for (const row of rows) {
			if (!found.has(row.googleEventId)) continue;
			const check = await followCalendar(row, found.get(row.googleEventId) ?? null);
			if (check.kind === "gone") missing = [...missing, { ...row, onWebsite: isListed(row) }];
			if (check.kind === "changed" && onSite(row)) rebuild = true;
		}
	} catch (error) {
		logServerError("Following Google Calendar's changes to outdoor sessions", error);
		return [];
	}
	if (rebuild) rebuildAfter();
	return missing;
}

/**
 * One outdoor session against its event, for its page: the row as her
 * calendar has it now, and whether the calendar still has it ("unknown" when
 * Google can't be asked).
 */
export async function checkOutdoorSession(
	userId: string,
	row: StudioSession,
): Promise<{ row: StudioSession; calendar: "ok" | "missing" | "unknown" }> {
	if (row.status !== "scheduled") return { row, calendar: "ok" };
	try {
		const looked = await withGoogle(userId, "Google Calendar", (token) => getEventById(token, row.googleEventId));
		if (looked.error !== undefined) return { row, calendar: "unknown" };
		const check = await followCalendar(row, looked.data);
		if (check.kind === "gone") return { row, calendar: "missing" };
		if (check.kind === "same") return { row, calendar: "ok" };
		if (onSite(row)) rebuildAfter();
		return { row: { ...row, ...check.set }, calendar: "ok" };
	} catch (error) {
		logServerError("Checking an outdoor session against Google Calendar", error);
		return { row, calendar: "unknown" };
	}
}

/**
 * The daily pass, before the website rebuilds: upcoming outdoor sessions
 * moved or renamed in a calendar follow it, even in weeks nobody opened. Any
 * Google account signed in here may hold the event. A deleted one is left for
 * her to see on the Schedule: nobody is here to ask. Returns how many changed.
 */
export async function syncUpcomingOutdoorSessions(now: Date = new Date()): Promise<number> {
	const rows = await db
		.select()
		.from(studioSessions)
		.where(and(eq(studioSessions.type, "outdoor"), eq(studioSessions.status, "scheduled"), gt(studioSessions.endsAt, now)));
	if (!rows.length) return 0;

	const owners = await db.select({ userId: accounts.userId }).from(accounts).where(eq(accounts.providerId, "google"));
	// An account whose sign-in has lapsed is skipped: its calendar is read on its next visit.
	const tokens = (await Promise.all(owners.map((o) => getValidAccessToken(o.userId).catch(() => null)))).filter((t) => t !== null);

	let changed = 0;
	for (const row of rows) {
		for (const token of tokens) {
			const event = await getEventById(token, row.googleEventId).catch(() => null);
			if (!event || event.status === "cancelled") continue;
			if ((await followCalendar(row, event)).kind === "changed") changed++;
			break;
		}
	}
	return changed;
}
