"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/drizzle";
import { healthLogs } from "@/drizzle/schema";
import { HealthCategory, HealthSeverity } from "@/lib/types/health";
import { createClient } from "@/supabase/server";

import { eq } from "drizzle-orm";

export type HealthLogInput = {
	category: HealthCategory;
	condition: string;
	severity: HealthSeverity;
	startDate: string | Date; // Form usually sends string, we convert
};

export async function addHealthLog(clientId: string, data: HealthLogInput) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "Not authenticated" };
	}

	try {
		// Business Logic: Critical/Warning severity = Active Alert
		const isAlert =
			data.severity === HealthSeverity.WARNING ||
			data.severity === HealthSeverity.CRITICAL;

		// Convert startDate to Date object if string
		const startDate = new Date(data.startDate);
        if (isNaN(startDate.getTime())) {
            return { error: "Invalid start date" };
        }

		await db.insert(healthLogs).values({
			clientId,
			category: data.category,
			condition: data.condition,
			severity: data.severity,
			isAlert,
			startDate: startDate.toISOString().split("T")[0], // Postgres date type expects YYYY-MM-DD
		});

		revalidatePath(`/clients/${clientId}`);
		return { success: true };
	} catch (error) {
		console.error("Error adding health log:", error);
		return { error: "Failed to add health log" };
	}
}

export async function toggleHealthAlert(logId: string, isAlert: boolean) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "Not authenticated" };
	}

	try {
        // We need clientId to revalidate path. 
        // We can create a returning statement or fetch it.
        // Drizzle insert/update 'returning' is supported.
		const updated = await db
			.update(healthLogs)
			.set({ isAlert })
			.where(eq(healthLogs.id, logId))
			.returning({ clientId: healthLogs.clientId });

        if (updated.length > 0) {
		    revalidatePath(`/clients/${updated[0].clientId}`);
        }
		return { success: true };
	} catch (error) {
		console.error("Error toggling health alert:", error);
		return { error: "Failed to update alert status" };
	}
}
