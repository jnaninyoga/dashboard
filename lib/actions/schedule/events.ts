"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { refundsFor, walletAfterRefund } from "@/lib/domain/schedule/cancel";
import { logServerError } from "@/lib/errors/server";
import { type CalendarEvent, type ScheduleEventInput, type WorkingHoursConfig } from "@/lib/types";
import { currentHourStart, fromStudioTime, STUDIO_TIME_ZONE, studioIsoString, weekdayOf } from "@/lib/utils/time";
import { db } from "@/services/database";
import { attendanceLedger, clientWallets, slotTypeEnum, studioSessions } from "@/services/database/schema";
import {
	cancelStudioEvent,
	checkAvailability,
	createStudioEvent,
	getEventById,
	getValidAccessToken,
	googleErrorMessage,
} from "@/services/google";

import { and, eq, inArray, isNull } from "drizzle-orm";

import { getWorkingHours } from "../settings";

const DEFAULT_HOURS: WorkingHoursConfig = {
	"1": { isOpen: true, start: "08:00", end: "20:00" },
	"2": { isOpen: true, start: "08:00", end: "20:00" },
	"3": { isOpen: true, start: "08:00", end: "20:00" },
	"4": { isOpen: true, start: "08:00", end: "20:00" },
	"5": { isOpen: true, start: "08:00", end: "20:00" },
	"6": { isOpen: true, start: "08:00", end: "14:00" },
	"0": { isOpen: false, start: "08:00", end: "20:00" },
};

// Node bundles its own time-zone data; builds older than 2026e still put
// Morocco on UTC+1, which would check the wrong hour against the calendar.
if (process.versions.tz && process.versions.tz < "2026e") {
	console.warn(
		`Node's time-zone data (${process.versions.tz}) predates Morocco's move to UTC+0; update Node.`,
	);
}

export async function scheduleNewEventAction(data: ScheduleEventInput) {
	const user = await requireUser();

	if (
		!/^\d{4}-\d{2}-\d{2}$/.test(data.dateStr) ||
		!/^\d{2}:\d{2}$/.test(data.startTimeStr) ||
		!/^\d{2}:\d{2}$/.test(data.endTimeStr)
	) {
		return { error: "Pick a date and a start and end time." };
	}

	// The times are the studio's wall clock; the phone's zone doesn't matter.
	const isoStart = studioIsoString(data.dateStr, data.startTimeStr);
	const isoEnd = studioIsoString(data.dateStr, data.endTimeStr);
	const weekday = weekdayOf(data.dateStr);

	// RULE 0: Reject past events. Events must start from the current hour onwards.
	if (fromStudioTime(data.dateStr, data.startTimeStr) < currentHourStart()) {
		return { error: "This time has already passed. Pick a later start." };
	}

	// RULE 1: Shop Hours Verification — only enforced for in-studio event types.
	// B2B and outdoor sessions are held off-site and are not bound to studio hours.
	const isStudioEvent = data.type === "group" || data.type === "private";
	if (isStudioEvent) {
		let workingHours = await getWorkingHours();
		if (!workingHours) {
			workingHours = DEFAULT_HOURS;
		}

		const dayConfig = workingHours[weekday.toString()];
		if (!dayConfig || !dayConfig.isOpen) {
			return { error: "Studio is closed on this day." };
		}

		// Simple string comparison works for HH:mm formats (e.g. "08:00" >= "07:00")
		if (data.startTimeStr < dayConfig.start || data.endTimeStr > dayConfig.end) {
			return {
				error: `Requested time is outside open hours. The studio is open from ${dayConfig.start} to ${dayConfig.end} on this day.`,
			};
		}
	}

	// Get Token
	let accessToken: string;
	try {
		accessToken = await getValidAccessToken(user.id);
	} catch (error) {
		return { error: googleErrorMessage(error, "Google Calendar") };
	}

	// RULE 2: Anti-Conflict Verification (Google Calendar FreeBusy API)
	const isFree = await checkAvailability(accessToken, isoStart, isoEnd);
	if (!isFree) {
		return { error: "Slot is already booked. Conflict detected." };
	}

	// RULE 3: Execution
	try {
		const newEvent = await createStudioEvent(accessToken, {
			title: data.title,
			// Google places the event with its own, always current, zone data.
			startTime: `${data.dateStr}T${data.startTimeStr}:00`,
			endTime: `${data.dateStr}T${data.endTimeStr}:00`,
			timeZone: STUDIO_TIME_ZONE,
			type: data.type,
			outdoorPrice: data.outdoorPrice,
			b2bPrice: data.b2bPrice,
			b2bPaxLabel: data.b2bPaxLabel,
		});

		// Her record of the session, kept even after it's cancelled. Without it
		// the session would have no history, so a failed write takes the event
		// back out of Google Calendar and the session isn't created at all.
		try {
			await db.insert(studioSessions).values({
				googleEventId: newEvent.id!,
				title: data.title,
				type: data.type,
				// Google's times, placed with its always-current zone data (a stale
				// Node can still think Morocco is on UTC+1); ours only as a fallback.
				startsAt: newEvent.start?.dateTime
					? new Date(newEvent.start.dateTime)
					: fromStudioTime(data.dateStr, data.startTimeStr),
				endsAt: newEvent.end?.dateTime ? new Date(newEvent.end.dateTime) : fromStudioTime(data.dateStr, data.endTimeStr),
			});
		} catch (error) {
			const ref = logServerError("Failed to record the new session", error);
			await cancelStudioEvent(accessToken, newEvent.id!).catch((undo) =>
				logServerError("Couldn't remove the unrecorded session from Google Calendar", undo),
			);
			return { error: "The session couldn't be saved. Nothing was added; try again.", ref };
		}

		return { success: true, event: newEvent };
	} catch (error) {
		return { error: "Failed to create the event in Google Calendar.", ref: logServerError("Failed to schedule event", error) };
	}
}

// Expected refusals, shown to her as they are.
class CancelRefused extends Error {}

const SLOT_TYPES: readonly string[] = slotTypeEnum.enumValues;

/** A Google event's start or end as an instant (all-day events start at midnight UTC). */
const instantOf = (time: CalendarEvent["start"]) => new Date(time?.dateTime ?? time?.date ?? Date.now());

/**
 * Cancels a session. It stays in her history, marked cancelled; its
 * check-ins are marked cancelled and each gives its credit back to the card
 * it came from; then the event leaves Google Calendar, freeing the slot (and
 * telling guests). All of it happens or none of it: if Google refuses, the
 * records are rolled back. Cancelling twice changes nothing more.
 */
export async function cancelEventAction(eventId: string, reason?: string) {
	if (!eventId) {
		return { error: "Missing event id." };
	}
	const user = await requireUser();

	let accessToken: string;
	let event: CalendarEvent | null;
	try {
		accessToken = await getValidAccessToken(user.id);
		// For sessions with no record yet (made before records existed, or in
		// Google Calendar itself), the cancelled record is built from it.
		event = await getEventById(accessToken, eventId);
	} catch (error) {
		return { error: googleErrorMessage(error, "Google Calendar") };
	}

	try {
		const result = await db.transaction(async (tx) => {
			const [session] = await tx
				.select()
				.from(studioSessions)
				.where(eq(studioSessions.googleEventId, eventId))
				.for("update");
			if (session?.status === "cancelled") return { refunded: 0, alreadyCancelled: true };
			if (!session && !event) throw new CancelRefused("This session no longer exists in Google Calendar.");

			const now = new Date();
			const cancellation = { status: "cancelled" as const, cancelledAt: now, cancelReason: reason?.trim() || null };
			if (session) {
				await tx.update(studioSessions).set(cancellation).where(eq(studioSessions.id, session.id));
			} else {
				const type = event!.extendedProperties?.private?.jnaninEventType;
				await tx.insert(studioSessions).values({
					googleEventId: eventId,
					title: event!.summary || "Session",
					type: type && SLOT_TYPES.includes(type) ? (type as (typeof slotTypeEnum.enumValues)[number]) : "group",
					startsAt: instantOf(event!.start),
					endsAt: instantOf(event!.end),
					...cancellation,
				});
			}

			// Its check-ins stay in history, marked cancelled, and give their credit back.
			const checkIns = await tx
				.select({
					id: attendanceLedger.id,
					walletId: attendanceLedger.walletId,
					slotType: attendanceLedger.slotType,
					cancelledAt: attendanceLedger.cancelledAt,
				})
				.from(attendanceLedger)
				.where(and(eq(attendanceLedger.googleEventId, eventId), isNull(attendanceLedger.cancelledAt)))
				.for("update");
			if (checkIns.length) {
				await tx
					.update(attendanceLedger)
					.set({ cancelledAt: now })
					.where(inArray(attendanceLedger.id, checkIns.map((c) => c.id)));
			}
			const refunds = refundsFor(checkIns);
			if (refunds.size) {
				const wallets = await tx
					.select()
					.from(clientWallets)
					.where(inArray(clientWallets.id, [...refunds.keys()]))
					.for("update");
				for (const wallet of wallets) {
					await tx
						.update(clientWallets)
						.set(walletAfterRefund(wallet, refunds.get(wallet.id)!))
						.where(eq(clientWallets.id, wallet.id));
				}
			}

			// Last, free the slot in Google Calendar. If Google refuses, the throw
			// rolls back everything above: the session is still on.
			if (event) await cancelStudioEvent(accessToken, eventId);

			return { refunded: [...refunds.values()].reduce((sum, n) => sum + n, 0), alreadyCancelled: false };
		});

		revalidatePath("/schedule");
		revalidatePath("/");
		revalidatePath("/clients");
		revalidatePath(`/check-in/${eventId}`);
		return { success: true as const, ...result };
	} catch (error) {
		if (error instanceof CancelRefused) return { error: error.message };
		return {
			error: "The session couldn't be cancelled. Nothing changed; try again.",
			ref: logServerError("Failed to cancel event", error),
		};
	}
}
