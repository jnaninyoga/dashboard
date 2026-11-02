"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { fold } from "@/lib/domain/billing/price-list";
import { type ProductKind, productLabel } from "@/lib/domain/price-list/product";
import { logServerError } from "@/lib/errors/server";
import { type ProductFormValues, productSchema } from "@/lib/validators";
import { db } from "@/services/database";
import { b2bDocumentLines, clientWallets, type NewProduct, products } from "@/services/database/schema";

import { and, asc, eq, ne } from "drizzle-orm";

export type PriceListState = { success?: boolean; error?: string; ref?: string; id?: string };

const PAGE: Record<ProductKind, string> = {
	membership: "/price-list/memberships",
	partner_service: "/price-list/partner-rates",
};

/**
 * Her price list of one kind: what she can sell now, or (`withArchived`)
 * everything she ever sold too. Memberships from the cheapest card, partner
 * services by name and group size.
 */
export async function getProducts(kind: ProductKind, { withArchived = false } = {}) {
	await requireUser();
	return db
		.select()
		.from(products)
		.where(withArchived ? eq(products.kind, kind) : and(eq(products.kind, kind), eq(products.isArchived, false)))
		.orderBy(...(kind === "membership" ? [asc(products.price), asc(products.name)] : [asc(products.name), asc(products.groupMin)]));
}

/** A product as it's stored: only the fields of its kind are kept. */
function rowOf(values: ProductFormValues): Omit<NewProduct, "id" | "createdAt" | "isArchived"> {
	const common = { kind: values.kind, name: values.name, price: values.price.toFixed(2) };
	return values.kind === "membership"
		? { ...common, credits: values.credits, durationMonths: values.durationMonths, unit: null, groupMin: null, groupMax: null }
		: { ...common, credits: null, durationMonths: null, unit: "session", groupMin: values.groupMin, groupMax: values.groupMax };
}

/**
 * Adds a product to her price list (`id` null) or changes one. A change
 * applies to what she sells from now on: cards sold and documents written
 * keep what they were sold at. The same product twice is refused.
 */
export async function saveProductAction(id: string | null, data: unknown): Promise<PriceListState> {
	await requireUser();
	const parsed = productSchema.safeParse(data);
	if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the fields" };
	const row = rowOf(parsed.data);

	try {
		const sameKind = await db
			.select()
			.from(products)
			.where(and(eq(products.kind, row.kind), eq(products.isArchived, false), id ? ne(products.id, id) : undefined));
		const label = productLabel(row);
		if (sameKind.some((other) => fold(productLabel(other)) === fold(label))) {
			return { error: `${label} is already on your price list.` };
		}

		if (id) {
			// A membership stays a membership: its kind isn't the form's to change.
			const [saved] = await db
				.update(products)
				.set(row)
				.where(and(eq(products.id, id), eq(products.kind, row.kind)))
				.returning({ id: products.id });
			if (!saved) return { error: "This product isn't on your price list any more." };
		} else {
			const [created] = await db.insert(products).values(row).returning({ id: products.id });
			id = created.id;
		}
		revalidatePath(PAGE[row.kind]);
		return { success: true, id };
	} catch (error) {
		return { error: "Couldn't save it", ref: logServerError("Saving a product", error) };
	}
}

/** Takes a product off what she sells (still named on what was sold), or puts it back. */
export async function setProductArchivedAction(id: string, archived: boolean): Promise<PriceListState> {
	await requireUser();
	try {
		const [product] = await db.select().from(products).where(eq(products.id, id));
		if (!product) return { error: "This product isn't on your price list any more." };
		if (!archived) {
			// Back on sale only if she hasn't made it again since.
			const onSale = await db
				.select()
				.from(products)
				.where(and(eq(products.kind, product.kind), eq(products.isArchived, false), ne(products.id, id)));
			if (onSale.some((other) => fold(productLabel(other)) === fold(productLabel(product)))) {
				return { error: `${productLabel(product)} is already on your price list.` };
			}
		}
		await db.update(products).set({ isArchived: archived }).where(eq(products.id, id));
		revalidatePath(PAGE[product.kind]);
		return { success: true };
	} catch (error) {
		return { error: "Couldn't change it", ref: logServerError("Archiving a product", error) };
	}
}

/**
 * Removes a product she never sold. Once a card or a document line names
 * it, it stays (archived), so what was sold keeps its name.
 */
export async function deleteProductAction(id: string): Promise<PriceListState> {
	await requireUser();
	try {
		const [onCard] = await db.select({ id: clientWallets.id }).from(clientWallets).where(eq(clientWallets.productId, id)).limit(1);
		const [onLine] = await db.select({ id: b2bDocumentLines.id }).from(b2bDocumentLines).where(eq(b2bDocumentLines.productId, id)).limit(1);
		if (onCard || onLine) {
			return { error: `Already sold${onCard ? " on a card" : " on a document"}: archive it instead, so what was sold keeps its name.` };
		}
		const [removed] = await db.delete(products).where(eq(products.id, id)).returning({ kind: products.kind });
		if (removed) revalidatePath(PAGE[removed.kind]);
		return { success: true };
	} catch (error) {
		return { error: "Couldn't delete it", ref: logServerError("Deleting a product", error) };
	}
}
