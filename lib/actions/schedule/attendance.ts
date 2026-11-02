"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { creditsSummary, LOW_CREDITS, shortDay } from "@/lib/domain/clients/card";
import { cardForCheckIn, checkInRefusal } from "@/lib/domain/clients/membership-sale";
import { renewalFor } from "@/lib/domain/clients/renewal";
import { logServerError } from "@/lib/errors/server";
import { formatDay, studioDateString } from "@/lib/utils/time";
import { db } from "@/services/database";
import { attendanceLedger, clients, clientWallets, healthLogs, products, studioSessions } from "@/services/database/schema";
import { HealthLog } from "@/services/database/schema";
import { type JnaninEventType } from "@/services/google";

import { and, desc, eq, inArray, isNull } from "drizzle-orm";

export interface AttendanceRecord {
	id: string;
	checkInTime: string;
	/** When the session was cancelled (the credit went back), or null. */
	cancelledAt: string | null;
	slotType: JnaninEventType;
	client: {
		id: string;
		fullName: string;
		photoUrl: string | null;
		healthLogs?: HealthLog[];
	};
}

// Expected refusals, shown to the operator as-is. Anything else is a bug and
// gets a generic message (Next.js hides thrown messages in production).
// `needsCard`: a sale would let the client in (no card, used up, expired).
class CheckInRefused extends Error {
	constructor(
		message: string,
		readonly needsCard = false,
	) {
		super(message);
	}
}

export async function checkInClientAction(
	clientId: string,
	eventId: string,
	slotType: JnaninEventType
): Promise<{ success: boolean; message: string; note?: string; ref?: string; needsCard?: boolean }> {
	await requireUser();
	try {
		const { message, note } = await db.transaction(async (tx): Promise<{ message: string; note?: string }> => {
			const [session] = await tx
				.select({ status: studioSessions.status, startsAt: studioSessions.startsAt })
				.from(studioSessions)
				.where(eq(studioSessions.googleEventId, eventId));
			if (session?.status === "cancelled") {
				throw new CheckInRefused("This session was cancelled.");
			}

			// Lock the client's wallets first: a double tap (or a second device)
			// waits here, then sees the first check-in below and is refused.
			const allWallets = await tx
				.select()
				.from(clientWallets)
				.where(eq(clientWallets.clientId, clientId))
				.orderBy(desc(clientWallets.activatedAt))
				.for("update");

			if (allWallets.length === 0) {
				throw new CheckInRefused("No membership card yet. Sell one to check them in.", true);
			}

			const existingCheckIns = await tx
				.select({ id: attendanceLedger.id })
				.from(attendanceLedger)
				.where(
					and(
						inArray(attendanceLedger.walletId, allWallets.map((w) => w.id)),
						eq(attendanceLedger.googleEventId, eventId)
					)
				)
				.limit(1);

			if (existingCheckIns.length > 0) {
				throw new CheckInRefused("Client is already checked in for this session.");
			}

			if (slotType === "outdoor") {
				// For outdoor events, we bypass standard credit deduction.
				// Attach to their most recent card (a sold one) for logging.
				await tx.insert(attendanceLedger).values({
					walletId: (allWallets.find((w) => w.status !== "cancelled") ?? allWallets[0]).id,
					googleEventId: eventId,
					slotType: slotType,
				});
				return { message: "Checked in", note: "Outdoor session: no credit taken." };
			}

			// A credit from a card that can be used on the session's day: the
			// one that ends soonest first. An expired card can't pay; she's told
			// which card, when it ended and what it held.
			const sessionDay = studioDateString(session?.startsAt ?? new Date());
			const activeWallet = cardForCheckIn(allWallets, sessionDay);

			if (!activeWallet) {
				const productIds = allWallets.flatMap((w) => (w.productId ? [w.productId] : []));
				const names = productIds.length
					? await tx.select({ id: products.id, name: products.name }).from(products).where(inArray(products.id, productIds))
					: [];
				const cards = allWallets.map((w) => ({ ...w, name: names.find((n) => n.id === w.productId)?.name }));
				throw new CheckInRefused(
					checkInRefusal(cards, sessionDay, (day) => formatDay(day, { day: "numeric", month: "long", year: "numeric" })) ??
						"No credits left. Sell a new membership to check them in.",
					true,
				);
			}

			// Safe to compute in JS: the row is locked for this transaction.
			const newRemaining = activeWallet.remainingCredits - 1;

			await tx
				.update(clientWallets)
				.set({
					remainingCredits: newRemaining,
					status: newRemaining === 0 ? "empty" : "active",
					lastUsedAt: new Date(),
				})
				.where(eq(clientWallets.id, activeWallet.id));

			await tx.insert(attendanceLedger).values({
				walletId: activeWallet.id,
				googleEventId: eventId,
				slotType: slotType,
			});

			// What's left, and a word when it's time to renew.
			const after = allWallets.map((w) => (w.id === activeWallet.id ? { ...w, remainingCredits: newRemaining, status: newRemaining === 0 ? "empty" : w.status } : w));
			const left = creditsSummary(after, sessionDay);
			const renewal = renewalFor(after, sessionDay);
			const ends = renewal?.reason === "ends" ? ` Their card ends ${shortDay(renewal.day, sessionDay)}.` : "";
			return {
				message: "Checked in",
				note: !left.count
					? "That was their last credit: time for a new card."
					: `1 credit taken, ${left.count <= LOW_CREDITS ? "only " : ""}${left.count} left.${ends}`,
			};
		});

		revalidatePath(`/check-in/${eventId}`);
		return { success: true, message, note };
	} catch (error) {
		if (error instanceof CheckInRefused) {
			return { success: false, message: error.message, needsCard: error.needsCard };
		}
		return {
			success: false,
			message: "Check-in failed. Please try again.",
			ref: logServerError("Check-in failed", error),
		};
	}
}

export async function getEventAttendanceAction(eventId: string): Promise<AttendanceRecord[]> {
	await requireUser();
	const records = await db
		.select({
			id: attendanceLedger.id,
			checkInTime: attendanceLedger.checkInTime,
			cancelledAt: attendanceLedger.cancelledAt,
			slotType: attendanceLedger.slotType,
			client: {
				id: clients.id,
				fullName: clients.fullName,
				photoUrl: clients.photoUrl,
			},
		})
		.from(attendanceLedger)
		.innerJoin(clientWallets, eq(attendanceLedger.walletId, clientWallets.id))
		.innerJoin(clients, eq(clientWallets.clientId, clients.id))
		.where(eq(attendanceLedger.googleEventId, eventId))
		.orderBy(desc(attendanceLedger.checkInTime));

	// Active alerts travel with each attendee, so the health panel is right
	// after a reload too, not only right after the check-in.
	const clientIds = [...new Set(records.map((r) => r.client.id))];
	const alerts = clientIds.length
		? await db
				.select()
				.from(healthLogs)
				.where(
					and(
						inArray(healthLogs.clientId, clientIds),
						eq(healthLogs.isAlert, true),
						isNull(healthLogs.endDate), // the app's rule for "active"
					),
				)
		: [];

	return records.map((r) => ({
		...r,
		checkInTime: r.checkInTime.toISOString(),
		cancelledAt: r.cancelledAt?.toISOString() ?? null,
		slotType: r.slotType as JnaninEventType,
		client: { ...r.client, healthLogs: alerts.filter((log) => log.clientId === r.client.id) },
	}));
}
