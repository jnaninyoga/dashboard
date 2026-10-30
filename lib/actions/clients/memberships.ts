"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { logServerError } from "@/lib/errors/server";
import { db } from "@/services/database";
import { clientWallets,memberships } from "@/services/database/schema";

import {desc, eq } from "drizzle-orm";

export async function getMembershipProducts() {
	await requireUser();
	return await db
		.select()
		.from(memberships)
		.where(eq(memberships.isArchived, false))
		.orderBy(desc(memberships.name));
}


export async function createMembershipProduct(
    _prevState: unknown,
    data: {
        name: string;
        basePrice: number;
        defaultCredits: number;
        durationMonths: number;
    }
) {
	await requireUser();
    try {
        await db.insert(memberships).values({
            name: data.name,
            basePrice: data.basePrice.toString(),
            defaultCredits: data.defaultCredits,
            durationMonths: data.durationMonths,
        });

        revalidatePath("/price-list/memberships");
        return { success: true };
    } catch (error) {
        return { error: "Failed to create membership product", ref: logServerError("Failed to create membership product", error) };
    }
}

export async function updateMembershipProduct(
	id: string,
    _prevState: unknown,
	data: {
		name: string;
		basePrice: number;
		defaultCredits: number;
		durationMonths: number;
	},
) {
	await requireUser();
    try {
        await db
            .update(memberships)
            .set({
                name: data.name,
                basePrice: data.basePrice.toString(),
                defaultCredits: data.defaultCredits,
                durationMonths: data.durationMonths,
            })
            .where(eq(memberships.id, id));

        revalidatePath("/price-list/memberships");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update membership product", ref: logServerError("Failed to update membership product", error) };
    }
}

export async function archiveMembershipProduct(id: string) {
	await requireUser();
	await db
		.update(memberships)
		.set({ isArchived: true })
		.where(eq(memberships.id, id));

	revalidatePath("/price-list/memberships");
}

export async function deleteMembershipProduct(id: string) {
	await requireUser();
	// Check if the product is in use
	const wallets = await db
		.select()
		.from(clientWallets)
		.where(eq(clientWallets.membershipId, id))
		.limit(1);

	if (wallets.length > 0) {
		throw new Error(
			"Cannot delete: This card is currently in use by clients. Archive it instead.",
		);
	}

	await db.delete(memberships).where(eq(memberships.id, id));

	revalidatePath("/price-list/memberships");
}
