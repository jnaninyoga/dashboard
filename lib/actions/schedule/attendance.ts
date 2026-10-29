"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { logServerError } from "@/lib/errors/server";
import { db } from "@/services/database";
import { attendanceLedger, clients, clientWallets, healthLogs } from "@/services/database/schema";
import { HealthLog } from "@/services/database/schema";
import { type JnaninEventType } from "@/services/google";

import { and, desc, eq, inArray, isNull } from "drizzle-orm";

export interface AttendanceRecord {
	id: string;
	checkInTime: string;
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
class CheckInRefused extends Error {}

export async function checkInClientAction(
	clientId: string,
	eventId: string,
	slotType: JnaninEventType
): Promise<{ success: boolean; message: string; ref?: string }> {
	await requireUser();
	try {
		const message = await db.transaction(async (tx) => {
			// Lock the client's wallets first: a double tap (or a second device)
			// waits here, then sees the first check-in below and is refused.
			const allWallets = await tx
				.select()
				.from(clientWallets)
				.where(eq(clientWallets.clientId, clientId))
				.orderBy(desc(clientWallets.activatedAt))
				.for("update");

			if (allWallets.length === 0) {
				throw new CheckInRefused("Client has no wallet. Please sell a new card to record attendance.");
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
				// Attach to their most recent wallet for logging.
				await tx.insert(attendanceLedger).values({
					walletId: allWallets[0].id,
					googleEventId: eventId,
					slotType: slotType,
				});
				return "Outdoor Check-in Successful (No credit deducted).";
			}

			// Standard logic (group, private, b2b) - needs an active wallet with > 0 credits
			const activeWallet = allWallets.find(w => w.status === "active" && w.remainingCredits > 0);

			if (!activeWallet) {
				throw new CheckInRefused("No active credits. Please sell a new card.");
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

			return "Check-in Successful. 1 credit deducted.";
		});

		revalidatePath(`/check-in/${eventId}`);
		return { success: true, message };
	} catch (error) {
		if (error instanceof CheckInRefused) {
			return { success: false, message: error.message };
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
			checkInTime: attendanceLedger.checkInTime, // This is Date in DB, we need to convert to string for the interface if required, or keep as Date.
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
		slotType: r.slotType as JnaninEventType,
		client: { ...r.client, healthLogs: alerts.filter((log) => log.clientId === r.client.id) },
	}));
}
