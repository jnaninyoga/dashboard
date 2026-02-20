"use server";

import { db } from "@/drizzle";
import { appSettings, clientCategories, clients } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// --- App Settings (Legacy/General) ---

export async function getAppSettings() {
    const settings = await db.select().from(appSettings);
    // Convert to object for easier consumption
    return settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as Record<string, string>);
}

export type WorkingHoursConfig = Record<string, { isOpen: boolean; start: string; end: string }>;

export async function getWorkingHours(): Promise<WorkingHoursConfig | null> {
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

export async function getClientCategories() {
    return await db.query.clientCategories.findMany({
        orderBy: (categories, { asc }) => [asc(categories.name)],
    });
}

export async function createClientCategory(data: {
    name: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
}) {
    await db.insert(clientCategories).values({
        name: data.name,
        discountType: data.discountType,
        discountValue: data.discountValue.toString(),
    });
    revalidatePath("/settings/categories");
}

export async function updateClientCategory(id: string, data: {
    name: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
}) {
    await db.update(clientCategories)
        .set({
            name: data.name,
            discountType: data.discountType,
            discountValue: data.discountValue.toString(),
        })
        .where(eq(clientCategories.id, id));
    revalidatePath("/settings/categories");
}

export async function archiveClientCategory(id: string) {
    await db.update(clientCategories)
        .set({ isArchived: true })
        .where(eq(clientCategories.id, id));
    revalidatePath("/settings/categories");
}

export async function restoreClientCategory(id: string) {
    await db.update(clientCategories)
        .set({ isArchived: false })
        .where(eq(clientCategories.id, id));
    revalidatePath("/settings/categories");
}

export async function deleteClientCategory(id: string) {
    // Check if in use
    const used = await db.query.clients.findFirst({
        where: eq(clients.categoryId, id)
    });

    if (used) {
        throw new Error("Cannot delete category: It is assigned to one or more clients. Archive it instead.");
    }

    await db.delete(clientCategories).where(eq(clientCategories.id, id));
    revalidatePath("/settings/categories");
}
