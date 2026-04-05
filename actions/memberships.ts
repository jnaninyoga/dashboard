"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/drizzle";
import { clientWallets,membershipProducts } from "@/drizzle/schema";

import {desc, eq } from "drizzle-orm";

export async function getMembershipProducts() {
	return await db
		.select()
		.from(membershipProducts)
		.where(eq(membershipProducts.isArchived, false))
		.orderBy(desc(membershipProducts.name));
}

export async function createMembershipProduct(data: {
	name: string;
	basePrice: number;
	defaultCredits: number;
	durationMonths: number;
}) {
	await db.insert(membershipProducts).values({
		name: data.name,
		basePrice: data.basePrice.toString(),
		defaultCredits: data.defaultCredits,
		durationMonths: data.durationMonths,
	});

	revalidatePath("/settings/memberships");
}

export async function updateMembershipProduct(
	id: string,
	data: {
		name: string;
		basePrice: number;
		defaultCredits: number;
		durationMonths: number;
	},
) {
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
}

export async function archiveMembershipProduct(id: string) {
	await db
		.update(membershipProducts)
		.set({ isArchived: true })
		.where(eq(membershipProducts.id, id));

	revalidatePath("/settings/memberships");
}

export async function deleteMembershipProduct(id: string) {
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
