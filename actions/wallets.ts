"use server";

import { db } from "@/drizzle";
import { clientWallets, membershipProducts } from "@/drizzle/schema";
import { createClient } from "@/supabase/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function assignProductToClient(clientId: string, productId: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "Not authenticated" };
	}

	try {
		// 1. Fetch product details
		const product = await db.query.membershipProducts.findFirst({
			where: eq(membershipProducts.id, productId),
		});

		if (!product) {
			return { error: "Product not found" };
		}

		// 2. Insert into client_wallets
		await db.insert(clientWallets).values({
			clientId,
			productId,
			remainingCredits: product.defaultCredits,
			status: "active",
			activatedAt: new Date(),
		});

		// 3. Revalidate
		revalidatePath(`/clients/${clientId}`);
        
		return { success: true };
	} catch (error) {
		console.error("Error assigning product:", error);
		return { error: "Failed to assign product" };
	}
}

export async function getMembershipProductsAction() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "Not authenticated" };
	}

	try {
        // Fetch all products
		const products = await db.query.membershipProducts.findMany({
            orderBy: (products, { asc }) => [asc(products.basePrice)]
        });
		return { success: true, products };
	} catch (error) {
		console.error("Error fetching products:", error);
		return { error: "Failed to fetch products" };
	}
}
