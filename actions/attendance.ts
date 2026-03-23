"use server";

import { db } from "@/drizzle";
import { attendanceLedger, clientWallets, clients } from "@/drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { type JnaninEventType } from "@/services/google-calendar";

export async function checkInClientAction(
	clientId: string,
	eventId: string,
	slotType: JnaninEventType
) {
	// First, check if already checked in
	const existingCheckIns = await db
		.select()
		.from(attendanceLedger)
		.innerJoin(clientWallets, eq(attendanceLedger.walletId, clientWallets.id))
		.where(
			and(
				eq(clientWallets.clientId, clientId),
				eq(attendanceLedger.googleEventId, eventId)
			)
		);

	if (existingCheckIns.length > 0) {
		throw new Error("Client is already checked in for this session.");
	}

	// Fetch client wallet(s)
	const allWallets = await db
		.select()
		.from(clientWallets)
		.where(eq(clientWallets.clientId, clientId))
		.orderBy(desc(clientWallets.activatedAt));

	if (allWallets.length === 0) {
		throw new Error("Client has no wallet. Please sell a new card to record attendance.");
	}

	if (slotType === "outdoor") {
		// For outdoor events, we bypass standard credit deduction.
		// Attach to their most recent wallet for logging.
		const targetWallet = allWallets[0];

		await db.insert(attendanceLedger).values({
			walletId: targetWallet.id,
			googleEventId: eventId,
			slotType: slotType,
		});

		revalidatePath(`/check-in/${eventId}`);
		return { success: true, message: "Outdoor Check-in Successful (No credit deducted)." };
	}

	// Standard logic (group, private, b2b) - needs an active wallet with > 0 credits
	const activeWallet = allWallets.find(w => w.status === "active" && w.remainingCredits > 0);

	if (!activeWallet) {
		throw new Error("No active credits. Please sell a new card.");
	}

	// Deduct credit
	const newRemaining = activeWallet.remainingCredits - 1;
	const newStatus = newRemaining === 0 ? "empty" : "active";

	// Update wallet in DB
	await db
		.update(clientWallets)
		.set({
			remainingCredits: newRemaining,
			status: newStatus,
			lastUsedAt: new Date(),
		})
		.where(eq(clientWallets.id, activeWallet.id));

	// Insert attendance
	await db.insert(attendanceLedger).values({
		walletId: activeWallet.id,
		googleEventId: eventId,
		slotType: slotType,
	});

	revalidatePath(`/check-in/${eventId}`);
	return { success: true, message: "Check-in Successful. 1 credit deducted." };
}

export async function getEventAttendanceAction(eventId: string) {
	const records = await db
		.select({
			id: attendanceLedger.id,
			checkInTime: attendanceLedger.checkInTime,
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

	return records;
}
