"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { logServerError } from "@/lib/errors/server";
import { db } from "@/services/database";
import { clientWallets,membershipProducts } from "@/services/database/schema";

import {desc, eq } from "drizzle-orm";

export async function getMembershipProducts() {
	await requireUser();
	return await db
		.select()
		.from(membershipProducts)
		.where(eq(membershipProducts.isArchived, false))
		.orderBy(desc(membershipProducts.name));
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
        await db.insert(membershipProducts).values({
            name: data.name,
            basePrice: data.basePrice.toString(),
            defaultCredits: data.defaultCredits,
            durationMonths: data.durationMonths,
        });

        revalidatePath("/settings/memberships");
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
            .update(membershipProducts)
            .set({
                name: data.name,
                basePrice: data.basePrice.toString(),
                defaultCredits: data.defaultCredits,
                durationMonths: data.durationMonths,
            })
            .where(eq(membershipProducts.id, id));

        revalidatePath("/settings/memberships");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update membership product", ref: logServerError("Failed to update membership product", error) };
    }
}

export async function archiveMembershipProduct(id: string) {
	await requireUser();
	await db
		.update(membershipProducts)
		.set({ isArchived: true })
		.where(eq(membershipProducts.id, id));

	revalidatePath("/settings/memberships");
}

export async function deleteMembershipProduct(id: string) {
	await requireUser();
	// Check if the product is in use
	const wallets = await db
		.select()
		.from(clientWallets)
		.where(eq(clientWallets.productId, id))
		.limit(1);

	if (wallets.length > 0) {
		throw new Error(
			"Cannot delete: This card is currently in use by clients. Archive it instead.",
		);
	}

	await db.delete(membershipProducts).where(eq(membershipProducts.id, id));

	revalidatePath("/settings/memberships");
}
