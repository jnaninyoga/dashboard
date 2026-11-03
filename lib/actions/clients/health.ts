"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { isAlertSeverity } from "@/lib/domain/clients/health";
import { logServerError } from "@/lib/errors/server";
import { studioDateString } from "@/lib/utils/time";
import { healthNoteSchema } from "@/lib/validators/health-note";
import { db } from "@/services/database";
import { healthLogs } from "@/services/database/schema";

import { eq } from "drizzle-orm";

type Result = { success?: true; error?: string; ref?: string };

const refresh = (clientId: string) => {
	revalidatePath(`/clients/${clientId}`);
	revalidatePath("/clients");
};

/** Adds a health note; a warning or critical one is an alert, shown at check-in. */
export async function addHealthNote(clientId: string, input: unknown): Promise<Result> {
	await requireUser();
	try {
		const parsed = healthNoteSchema.safeParse(input);
		if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the note" };
		const note = parsed.data;
		if (note.startDate > studioDateString()) return { error: "The day can't be in the future." };

		await db.insert(healthLogs).values({
			clientId,
			category: note.category,
			severity: note.severity,
			condition: note.condition,
			treatment: note.treatment || null,
			isAlert: isAlertSeverity(note.severity),
			startDate: note.startDate,
		});
		refresh(clientId);
		return { success: true };
	} catch (error) {
		return { error: "Couldn't add the note", ref: logServerError("Adding a health note", error) };
	}
}

/**
 * Marks a note resolved today: it stops showing as an alert at check-in and
 * stays in the client's history.
 */
export async function resolveHealthNote(noteId: string): Promise<Result> {
	await requireUser();
	try {
		const [note] = await db
			.update(healthLogs)
			.set({ isAlert: false, endDate: studioDateString() })
			.where(eq(healthLogs.id, noteId))
			.returning({ clientId: healthLogs.clientId });
		if (!note) return { error: "This note doesn't exist any more." };
		refresh(note.clientId);
		return { success: true };
	} catch (error) {
		return { error: "Couldn't resolve the note", ref: logServerError("Resolving a health note", error) };
	}
}

/** Opens a resolved note again (it came back, or was resolved by mistake). */
export async function reopenHealthNote(noteId: string): Promise<Result> {
	await requireUser();
	try {
		const [found] = await db.select({ severity: healthLogs.severity }).from(healthLogs).where(eq(healthLogs.id, noteId));
		if (!found) return { error: "This note doesn't exist any more." };
		const [note] = await db
			.update(healthLogs)
			.set({ isAlert: isAlertSeverity(found.severity), endDate: null })
			.where(eq(healthLogs.id, noteId))
			.returning({ clientId: healthLogs.clientId });
		refresh(note.clientId);
		return { success: true };
	} catch (error) {
		return { error: "Couldn't reopen the note", ref: logServerError("Reopening a health note", error) };
	}
}
