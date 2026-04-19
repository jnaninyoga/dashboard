"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/drizzle";
import { appSettings, b2bPricingTiers, clientCategories, clients } from "@/drizzle/schema";

import { asc, eq } from "drizzle-orm";

// --- App Settings (Legacy/General) ---

export async function getAppSettings() {
    const settings = await db.select().from(appSettings);
    // Convert to object for easier consumption
    return settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as Record<string, string>);
}

import { type WorkingHoursConfig } from "@/lib/types";

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

export async function createClientCategory(
    _prevState: unknown,
    data: {
        name: string;
        discountType: "percentage" | "fixed";
        discountValue: number;
    }
) {
    try {
        await db.insert(clientCategories).values({
            name: data.name,
            discountType: data.discountType,
            discountValue: data.discountValue.toString(),
        });
        revalidatePath("/settings/categories");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create category" };
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
    try {
        await db.update(clientCategories)
            .set({
                name: data.name,
                discountType: data.discountType,
                discountValue: data.discountValue.toString(),
            })
            .where(eq(clientCategories.id, id));
        revalidatePath("/settings/categories");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to update category" };
    }
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

// --- B2B Pricing Tiers ---

export async function getB2BPricingTiers() {
    return await db.query.b2bPricingTiers.findMany({
        orderBy: [asc(b2bPricingTiers.name)],
    });
}

import { b2bTierSchema } from "@/lib/validators";

export async function createB2BTierAction(_prevState: unknown, formData: FormData) {
    const rawData = {
        name: formData.get("name") as string,
        price: formData.get("price") as string,
    };

    const parsed = b2bTierSchema.safeParse(rawData);

    if (!parsed.success) {
        return { error: "Validation failed", issues: parsed.error.format() };
    }

    try {
        await db.insert(b2bPricingTiers).values({
            name: parsed.data.name,
            price: Number(parsed.data.price),
        });
        revalidatePath("/settings/b2b");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create B2B tier" };
    }
}

export async function updateB2BTierAction(id: string, _prevState: unknown, formData: FormData) {
    const rawData = {
        name: formData.get("name") as string,
        price: formData.get("price") as string,
    };

    const parsed = b2bTierSchema.safeParse(rawData);

    if (!parsed.success) {
        return { error: "Validation failed", issues: parsed.error.format() };
    }

    try {
        await db.update(b2bPricingTiers)
            .set({
                name: parsed.data.name,
                price: Number(parsed.data.price),
            })
            .where(eq(b2bPricingTiers.id, id));
        revalidatePath("/settings/b2b");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to update B2B tier" };
    }
}

export async function deleteB2BTierAction(id: string) {
    try {
        await db.delete(b2bPricingTiers).where(eq(b2bPricingTiers.id, id));
        revalidatePath("/settings/b2b");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to delete B2B tier" };
    }
}

export async function toggleArchiveB2BTierAction(id: string, isArchived: boolean) {
    try {
        await db.update(b2bPricingTiers)
            .set({ isArchived: !isArchived })
            .where(eq(b2bPricingTiers.id, id));
        revalidatePath("/settings/b2b");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to update archive status" };
    }
}
