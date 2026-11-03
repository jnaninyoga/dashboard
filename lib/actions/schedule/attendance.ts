"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { creditsSummary, LOW_CREDITS, shortDay } from "@/lib/domain/clients/card";
import { cardForCheckIn, checkInRefusal } from "@/lib/domain/clients/membership-sale";
import { renewalFor } from "@/lib/domain/clients/renewal";
import { walletAfterRefund } from "@/lib/domain/schedule/cancel";
import { logServerError } from "@/lib/errors/server";
import { type ClientWithRelations } from "@/lib/types";
import { formatDay, studioDateString } from "@/lib/utils/time";
import { db } from "@/services/database";
import { attendanceLedger, clients, clientWallets, healthLogs, products, studioSessions } from "@/services/database/schema";
import { HealthLog } from "@/services/database/schema";
import { type JnaninEventType } from "@/services/google";

import { and, desc, eq, gte, inArray, isNull, ne, sql } from "drizzle-orm";

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
): Promise<{
	success: boolean;
	message: string;
	note?: string;
	/** The check-in made: its id lets her undo a mistaken tap. */
	record?: { id: string; checkInTime: string };
	ref?: string;
	needsCard?: boolean;
}> {
	await requireUser();
	try {
		const { message, note, record } = await db.transaction(async (tx): Promise<{ message: string; note?: string; record: { id: string; checkInTime: Date } }> => {
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
				const [record] = await tx
					.insert(attendanceLedger)
					.values({
						walletId: (allWallets.find((w) => w.status !== "cancelled") ?? allWallets[0]).id,
						googleEventId: eventId,
						slotType: slotType,
					})
					.returning({ id: attendanceLedger.id, checkInTime: attendanceLedger.checkInTime });
				return { message: "Checked in", note: "Outdoor session: no credit taken.", record };
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

			const [record] = await tx
				.insert(attendanceLedger)
				.values({
					walletId: activeWallet.id,
					googleEventId: eventId,
					slotType: slotType,
				})
				.returning({ id: attendanceLedger.id, checkInTime: attendanceLedger.checkInTime });

			// What's left, and a word when it's time to renew.
			const after = allWallets.map((w) => (w.id === activeWallet.id ? { ...w, remainingCredits: newRemaining, status: newRemaining === 0 ? "empty" : w.status } : w));
			const left = creditsSummary(after, sessionDay);
			const renewal = renewalFor(after, sessionDay);
			const ends = renewal?.reason === "ends" ? ` Their card ends ${shortDay(renewal.day, sessionDay)}.` : "";
			return {
				message: "Checked in",
				record,
				note: !left.count
					? "That was their last credit: time for a new card."
					: `1 credit taken, ${left.count <= LOW_CREDITS ? "only " : ""}${left.count} left.${ends}`,
			};
		});

		revalidatePath(`/check-in/${eventId}`);
		return { success: true, message, note, record: { id: record.id, checkInTime: record.checkInTime.toISOString() } };
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

/**
 * Takes back a check-in tapped by mistake, while the session isn't over:
 * the visit didn't happen, so the row goes and the credit returns to its
 * card (outdoor sessions took none).
 */
export async function undoCheckInAction(checkInId: string): Promise<{ success: boolean; message: string; ref?: string }> {
	await requireUser();
	try {
		const message = await db.transaction(async (tx) => {
			const [checkIn] = await tx
				.select()
				.from(attendanceLedger)
				.where(eq(attendanceLedger.id, checkInId))
				.for("update");
			if (!checkIn) throw new CheckInRefused("This check-in was already taken back.");
			if (checkIn.cancelledAt) throw new CheckInRefused("This session was cancelled: its credits already went back.");
			const [session] = await tx
				.select({ endsAt: studioSessions.endsAt })
				.from(studioSessions)
				.where(eq(studioSessions.googleEventId, checkIn.googleEventId ?? ""));
			if (session && session.endsAt < new Date()) throw new CheckInRefused("This session is over: its attendance stays as it was.");

			await tx.delete(attendanceLedger).where(eq(attendanceLedger.id, checkIn.id));
			if (checkIn.slotType === "outdoor") return "Check-in taken back";
			const [wallet] = await tx.select().from(clientWallets).where(eq(clientWallets.id, checkIn.walletId)).for("update");
			await tx.update(clientWallets).set(walletAfterRefund(wallet, 1)).where(eq(clientWallets.id, wallet.id));
			return "Check-in taken back, credit returned";
		});
		return { success: true, message };
	} catch (error) {
		if (error instanceof CheckInRefused) return { success: false, message: error.message };
		return { success: false, message: "Couldn't take the check-in back", ref: logServerError("Undoing a check-in", error) };
	}
}

/**
 * Who usually comes to this class and isn't checked in yet, to check in with
 * one tap: the clients seen most at sessions of the same name over the last
 * six weeks (or, for a new class, the studio's regulars of the last two),
 * with their cards and active health alerts, as the search gives them.
 */
export async function getUsualAttendees(eventId: string, title: string, limit = 8): Promise<ClientWithRelations[]> {
	await requireUser();
	const visits = sql<number>`count(*)`.mapWith(Number);
	const seen = (since: Date, sameClass: boolean) =>
		db
			.select({ clientId: clientWallets.clientId, visits })
			.from(attendanceLedger)
			.innerJoin(clientWallets, eq(attendanceLedger.walletId, clientWallets.id))
			.innerJoin(studioSessions, eq(studioSessions.googleEventId, attendanceLedger.googleEventId))
			.where(
				and(
					isNull(attendanceLedger.cancelledAt),
					gte(attendanceLedger.checkInTime, since),
					ne(attendanceLedger.googleEventId, eventId),
					sameClass ? sql`lower(trim(${studioSessions.title})) = lower(trim(${title}))` : undefined,
				),
			)
			.groupBy(clientWallets.clientId)
			.orderBy(desc(visits))
			.limit(limit);

	const days = (n: number) => new Date(Date.now() - n * 86_400_000);
	let regulars = await seen(days(42), true);
	if (!regulars.length) regulars = await seen(days(14), false);
	if (!regulars.length) return [];

	const rows = (await db.query.clients.findMany({
		where: inArray(clients.id, regulars.map((r) => r.clientId)),
		with: {
			wallets: { where: ne(clientWallets.status, "cancelled"), with: { product: true }, orderBy: desc(clientWallets.activatedAt) },
			healthLogs: { where: and(eq(healthLogs.isAlert, true), isNull(healthLogs.endDate)) },
		},
	})) as ClientWithRelations[];
	const order = new Map(regulars.map((r, i) => [r.clientId, i]));
	return rows.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
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
