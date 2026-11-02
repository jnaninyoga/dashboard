"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { logServerError } from "@/lib/errors/server";
import { db } from "@/services/database";
import { appSettings, clients, discounts } from "@/services/database/schema";

import { eq } from "drizzle-orm";

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

export async function setWorkingHours(config: WorkingHoursConfig) {
	await requireUser();
    const valueStr = JSON.stringify(config);
    await db.insert(appSettings).values({
        key: "working_hours",
        value: valueStr
    }).onConflictDoUpdate({
        target: appSettings.key,
        set: { value: valueStr }
    });
    revalidatePath("/settings");
    revalidatePath("/");
}

// --- Dynamic Categories ---

export async function getDiscounts() {
	await requireUser();
    return await db.query.discounts.findMany({
        orderBy: (categories, { asc }) => [asc(categories.name)],
    });
}

export async function createClientCategory(
    _prevState: unknown,
    data: {
        name: string;
        discountType: "percentage" | "fixed";
        discountValue: number;
    }
) {
	await requireUser();
    try {
        await db.insert(discounts).values({
            name: data.name,
            discountType: data.discountType,
            discountValue: data.discountValue.toString(),
        });
        revalidatePath("/price-list/discounts");
        return { success: true };
    } catch (error) {
        return { error: "Failed to create category", ref: logServerError("Failed to create category", error) };
    }
}

export async function updateClientCategory(
    id: string,
    _prevState: unknown,
    data: {
        name: string;
        discountType: "percentage" | "fixed";
        discountValue: number;
    }
) {
	await requireUser();
    try {
        await db.update(discounts)
            .set({
                name: data.name,
                discountType: data.discountType,
                discountValue: data.discountValue.toString(),
            })
            .where(eq(discounts.id, id));
        revalidatePath("/price-list/discounts");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update category", ref: logServerError("Failed to update category", error) };
    }
}

export async function archiveClientCategory(id: string) {
	await requireUser();
    await db.update(discounts)
        .set({ isArchived: true })
        .where(eq(discounts.id, id));
    revalidatePath("/price-list/discounts");
}

export async function restoreClientCategory(id: string) {
	await requireUser();
    await db.update(discounts)
        .set({ isArchived: false })
        .where(eq(discounts.id, id));
    revalidatePath("/price-list/discounts");
}

export async function deleteClientCategory(id: string) {
	await requireUser();
    // Check if in use
    const used = await db.query.clients.findFirst({
        where: eq(clients.discountId, id)
    });

    if (used) {
        throw new Error("Cannot delete category: It is assigned to one or more clients. Archive it instead.");
    }

    await db.delete(discounts).where(eq(discounts.id, id));
    revalidatePath("/price-list/discounts");
}
