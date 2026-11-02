"use server";

import { revalidatePath } from "next/cache";

import { logServerError } from "@/lib/errors/server";
import { db } from "@/services/database";
import { clients, clientWallets, products } from "@/services/database/schema";
import { createClient } from "@/services/supabase/server";

import { and, eq } from "drizzle-orm";

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
				discount: true,
			},
		});

		if (!clientData) {
			return { error: "Client not found" };
		}
        
        // Use the category relation (if exists) for discounts
        const clientCategory = clientData.discount;

		// 2. Fetch product details
		const product = await db.query.products.findFirst({
			where: and(eq(products.id, productId), eq(products.kind, "membership")),
		});

		if (!product) {
			return { error: "Product not found" };
		}

		// 3. Calculate Final Price
		let finalPrice = parseFloat(product.price);

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
			remainingCredits: product.credits ?? 0,
			status: "active",
            amountPaid: finalPrice.toFixed(2),
			activatedAt: new Date(),
		});

		// 5. Revalidate
		revalidatePath(`/clients/${clientId}`);
        
		return { success: true };
	} catch (error) {
		return { error: "Failed to assign product", ref: logServerError("Error assigning product", error) };
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
		const memberships = await db.query.products.findMany({
            where: and(eq(products.kind, "membership"), eq(products.isArchived, false)),
            orderBy: (product, { asc }) => [asc(product.price)]
        });
		return { success: true, products: memberships };
	} catch (error) {
		return { error: "Failed to fetch products", ref: logServerError("Error fetching products", error) };
	}
}
