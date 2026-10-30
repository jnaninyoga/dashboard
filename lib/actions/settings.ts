"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { logServerError } from "@/lib/errors/server";
import { db } from "@/services/database";
import { appSettings, clients,discounts, partnerRates } from "@/services/database/schema";

import { asc, eq } from "drizzle-orm";

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

// --- B2B Pricing Tiers ---

export async function getPartnerRates() {
	await requireUser();
    return await db.query.partnerRates.findMany({
        orderBy: [asc(partnerRates.name)],
    });
}

import { b2bTierSchema } from "@/lib/validators";

export async function createB2BTierAction(_prevState: unknown, formData: FormData) {
	await requireUser();
    const rawData = {
        name: formData.get("name") as string,
        price: formData.get("price") as string,
    };

    const parsed = b2bTierSchema.safeParse(rawData);

    if (!parsed.success) {
        return { error: "Validation failed", issues: parsed.error.format() };
    }

    try {
        await db.insert(partnerRates).values({
            name: parsed.data.name,
            price: Number(parsed.data.price),
        });
        revalidatePath("/price-list/partner-rates");
        return { success: true };
    } catch (error) {
        return { error: "Failed to create B2B tier", ref: logServerError("Failed to create B2B tier", error) };
    }
}

export async function updateB2BTierAction(id: string, _prevState: unknown, formData: FormData) {
	await requireUser();
    const rawData = {
        name: formData.get("name") as string,
        price: formData.get("price") as string,
    };

    const parsed = b2bTierSchema.safeParse(rawData);

    if (!parsed.success) {
        return { error: "Validation failed", issues: parsed.error.format() };
    }

    try {
        await db.update(partnerRates)
            .set({
                name: parsed.data.name,
                price: Number(parsed.data.price),
            })
            .where(eq(partnerRates.id, id));
        revalidatePath("/price-list/partner-rates");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update B2B tier", ref: logServerError("Failed to update B2B tier", error) };
    }
}

export async function deleteB2BTierAction(id: string) {
	await requireUser();
    try {
        await db.delete(partnerRates).where(eq(partnerRates.id, id));
        revalidatePath("/price-list/partner-rates");
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete B2B tier", ref: logServerError("Failed to delete B2B tier", error) };
    }
}

export async function toggleArchiveB2BTierAction(id: string, isArchived: boolean) {
	await requireUser();
    try {
        await db.update(partnerRates)
            .set({ isArchived: !isArchived })
            .where(eq(partnerRates.id, id));
        revalidatePath("/price-list/partner-rates");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update archive status", ref: logServerError("Failed to update archive status", error) };
    }
}
