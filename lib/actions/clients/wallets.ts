"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/services/database";
import {clients, clientWallets, membershipProducts } from "@/services/database/schema";
import { createClient } from "@/services/supabase/server";

import {eq } from "drizzle-orm";

export async function assignProductToClient(clientId: string, productId: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "Not authenticated" };
	}

	try {
		// 1. Fetch Client with Category Relation
		const clientData = await db.query.clients.findFirst({
			where: eq(clients.id, clientId),
			with: {
				category: true,
			},
		});

		if (!clientData) {
			return { error: "Client not found" };
		}
        
        // Use the category relation (if exists) for discounts
        const clientCategory = clientData.category;

		// 2. Fetch product details
		const product = await db.query.membershipProducts.findFirst({
			where: eq(membershipProducts.id, productId),
		});

		if (!product) {
			return { error: "Product not found" };
		}

		// 3. Calculate Final Price
		let finalPrice = parseFloat(product.basePrice);

		// Apply Dynamic Category Discount
		if (clientCategory && !Array.isArray(clientCategory)) {

			const discountValue = parseFloat(clientCategory.discountValue || "0");
			if (discountValue > 0) {
				if (clientCategory.discountType === "percentage") {
					const discountAmount = (finalPrice * discountValue) / 100;
					finalPrice -= discountAmount;
				} else {
					// Fixed amount discount
					finalPrice = Math.max(0, finalPrice - discountValue);
				}
			}
		}

		// 4. Insert into client_wallets
		await db.insert(clientWallets).values({
			clientId,
			productId,
			remainingCredits: product.defaultCredits,
			status: "active",
            amountPaid: finalPrice.toFixed(2),
			activatedAt: new Date(),
		});

		// 5. Revalidate
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
        // Fetch all active products
		const products = await db.query.membershipProducts.findMany({
            where: eq(membershipProducts.isArchived, false),
            orderBy: (products, { asc }) => [asc(products.basePrice)]
        });
		return { success: true, products };
	} catch (error) {
		console.error("Error fetching products:", error);
		return { error: "Failed to fetch products" };
	}
}
