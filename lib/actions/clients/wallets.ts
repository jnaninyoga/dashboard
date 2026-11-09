"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { saleRow } from "@/lib/domain/clients/membership-sale";
import { logServerError } from "@/lib/errors/server";
import { parseAmountInput } from "@/lib/utils/currency";
import { fromStudioTime, studioDateString } from "@/lib/utils/time";
import { cancelSaleSchema, sellMembershipSchema } from "@/lib/validators/membership-sale";
import { db } from "@/services/database";
import { clients, clientWallets, discounts, products } from "@/services/database/schema";

import { and, eq, ne } from "drizzle-orm";

/**
 * Sells a membership to a client: her price, the discount she gives (the
 * client's by default), the price she settles on, how she was paid. The
 * card gets the membership's credits and its last day.
 */
export async function sellMembershipAction(
	clientId: string,
	input: unknown,
): Promise<{ success?: true; error?: string; ref?: string }> {
	await requireUser();
	try {
		const parsed = sellMembershipSchema.safeParse(input);
		if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the sale" };
		const sale = parsed.data;
		const today = studioDateString();
		if (sale.soldOn > today) return { error: "The sale day can't be in the future." };

		const [client, membership, discount] = await Promise.all([
			db.query.clients.findFirst({ where: eq(clients.id, clientId), columns: { id: true } }),
			db.query.products.findFirst({ where: and(eq(products.id, sale.membershipId), eq(products.kind, "membership")) }),
			sale.discountId ? db.query.discounts.findFirst({ where: eq(discounts.id, sale.discountId) }) : null,
		]);
		if (!client) return { error: "Client not found" };
		if (!membership || membership.isArchived) return { error: "This membership isn't on sale any more." };
		if (sale.discountId && !discount) return { error: "This discount doesn't exist any more." };

		await db.insert(clientWallets).values(
			saleRow({
				clientId,
				membership,
				discount: discount ?? null,
				price: Math.round(parseAmountInput(sale.price) * 100) / 100,
				soldOn: sale.soldOn,
				// Today's sale keeps its time; an earlier one, midday that day.
				soldAt: sale.soldOn === today ? new Date() : fromStudioTime(sale.soldOn, "12:00"),
				paymentMethod: sale.paymentMethod,
				paymentReference: sale.paymentReference,
				physicalCardRef: sale.physicalCardRef,
			}),
		);

		revalidatePath(`/clients/${clientId}`);
		revalidatePath("/clients");
		revalidatePath("/price-list/memberships");
		return { success: true };
	} catch (error) {
		return { error: "Couldn't record the sale", ref: logServerError("Error selling a membership", error) };
	}
}

const CANCEL_LABEL = { mistake: "Sold by mistake", refunded: "Money given back" } as const;

/**
 * Undoes a card sale: it was sold by mistake, or the client got their money
 * back. The card stays on record, crossed out with why, and its credits stop
 * counting; the visits already taken from it stay in their history.
 */
export async function cancelCardSaleAction(
	walletId: string,
	input: unknown,
): Promise<{ success?: true; error?: string; ref?: string }> {
	await requireUser();
	try {
		const parsed = cancelSaleSchema.safeParse(input);
		if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Say why" };
		const { reason, note } = parsed.data;
		const label = CANCEL_LABEL[reason];

		// One statement, so a check-in at the same moment either comes first or finds it cancelled.
		const [card] = await db
			.update(clientWallets)
			.set({ status: "cancelled", cancelledAt: new Date(), cancelReason: note ? `${label}: ${note}` : label })
			.where(and(eq(clientWallets.id, walletId), ne(clientWallets.status, "cancelled")))
			.returning({ clientId: clientWallets.clientId });
		if (!card) {
			const exists = await db.query.clientWallets.findFirst({ where: eq(clientWallets.id, walletId), columns: { id: true } });
			return { error: exists ? "This sale was already undone." : "Card not found" };
		}

		revalidatePath(`/clients/${card.clientId}`);
		revalidatePath("/clients");
		revalidatePath("/price-list/memberships");
		revalidatePath("/");
		return { success: true };
	} catch (error) {
		return { error: "Couldn't undo the sale", ref: logServerError("Error undoing a card sale", error) };
	}
}

export async function getMembershipProductsAction() {
	await requireUser();

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
