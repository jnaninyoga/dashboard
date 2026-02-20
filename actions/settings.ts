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
