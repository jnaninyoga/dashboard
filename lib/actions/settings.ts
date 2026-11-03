"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { logServerError } from "@/lib/errors/server";
import { discountSchema } from "@/lib/validators/discount";
import { workingHoursSchema } from "@/lib/validators/working-hours";
import { db } from "@/services/database";
import { appSettings, clients, discounts } from "@/services/database/schema";

import { count, eq, isNotNull } from "drizzle-orm";

// --- App Settings (Legacy/General) ---

export async function getAppSettings() {
	await requireUser();
    const settings = await db.select().from(appSettings);
    // Convert to object for easier consumption
    return settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as Record<string, string>);
}

import { type WorkingHoursConfig } from "@/lib/types";

export async function getWorkingHours(): Promise<WorkingHoursConfig | null> {
	await requireUser();
    const setting = await db.query.appSettings.findFirst({
        where: eq(appSettings.key, "working_hours")
    });
    
    if (!setting || !setting.value) return null;
    try {
        return JSON.parse(setting.value) as WorkingHoursConfig;
    } catch {
        return null;
    }
}

export async function setWorkingHours(config: unknown): Promise<{ success?: boolean; error?: string; ref?: string }> {
	await requireUser();
	const parsed = workingHoursSchema.safeParse(config);
	if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the hours" };
	try {
		const value = JSON.stringify(parsed.data);
		await db
			.insert(appSettings)
			.values({ key: "working_hours", value })
			.onConflictDoUpdate({ target: appSettings.key, set: { value } });
		revalidatePath("/settings/schedule");
		revalidatePath("/schedule");
		revalidatePath("/");
		return { success: true };
	} catch (error) {
		return { error: "Couldn't save the hours", ref: logServerError("Saving studio hours", error) };
	}
}

// --- Discounts ---

export async function getDiscounts() {
	await requireUser();
    return await db.query.discounts.findMany({
        orderBy: (categories, { asc }) => [asc(categories.name)],
    });
}

/** How many clients have each discount (a discount nobody has is left out). */
export async function getDiscountClientCounts(): Promise<Record<string, number>> {
	await requireUser();
	const rows = await db
		.select({ discountId: clients.discountId, count: count() })
		.from(clients)
		.where(isNotNull(clients.discountId))
		.groupBy(clients.discountId);
	return Object.fromEntries(rows.map((row) => [row.discountId!, row.count]));
}

/** Adds a discount (`id` null) or changes one: clients who have it get the change on their next card. */
export async function saveDiscountAction(id: string | null, data: unknown): Promise<{ success?: boolean; error?: string; ref?: string }> {
	await requireUser();
	const parsed = discountSchema.safeParse(data);
	if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the discount" };
	const row = { ...parsed.data, discountValue: parsed.data.discountValue.toFixed(2) };
	try {
		if (id) await db.update(discounts).set(row).where(eq(discounts.id, id));
		else await db.insert(discounts).values(row);
		revalidatePath("/price-list/discounts");
		return { success: true };
	} catch (error) {
		return { error: "Couldn't save the discount", ref: logServerError("Saving a discount", error) };
	}
}

/** Takes a discount off what she offers (clients who have it keep it), or offers it again. */
export async function setDiscountArchivedAction(id: string, archived: boolean): Promise<{ success?: boolean; error?: string; ref?: string }> {
	await requireUser();
	try {
		await db.update(discounts).set({ isArchived: archived }).where(eq(discounts.id, id));
		revalidatePath("/price-list/discounts");
		return { success: true };
	} catch (error) {
		return { error: "Couldn't change it", ref: logServerError("Archiving a discount", error) };
	}
}

/** Removes a discount no client has; one that's given stays (archive it). */
export async function deleteDiscountAction(id: string): Promise<{ success?: boolean; error?: string; ref?: string }> {
	await requireUser();
	try {
		const given = await db.query.clients.findFirst({ where: eq(clients.discountId, id), columns: { id: true } });
		if (given) return { error: "Clients have this discount: archive it instead, and they keep it." };
		await db.delete(discounts).where(eq(discounts.id, id));
		revalidatePath("/price-list/discounts");
		return { success: true };
	} catch (error) {
		return { error: "Couldn't delete it", ref: logServerError("Deleting a discount", error) };
	}
}
