// What she sells, as it reads: a service with the group it takes ("Famille
// (3–5 pax)"), a quantity in what it counts ("10 séances"), and which lines
// of a document still sell a product from her price list.

import { fold } from "@/lib/domain/billing/price-list";

export type ProductKind = "membership" | "partner_service";
export type ProductUnit = "session";

type Group = { groupMin?: number | null; groupMax?: number | null };

/** The group a service takes, in people (pax): "3–5 pax", "10+ pax", "2 pax"; null for any group. */
export function groupSize({ groupMin, groupMax }: Group): string | null {
	if (groupMin && groupMax) return groupMin === groupMax ? `${groupMin} pax` : `${groupMin}–${groupMax} pax`;
	if (groupMin) return `${groupMin}+ pax`;
	if (groupMax) return `up to ${groupMax} pax`;
	return null;
}

/** How a product reads on a document line: "Famille (3–5 pax)"; a name alone without a group. */
export function productLabel(product: Group & { name: string }) {
	const group = groupSize(product);
	return group ? `${product.name} (${group})` : product.name;
}

const UNITS: Record<ProductUnit, Record<"en" | "fr", [one: string, many: string]>> = {
	session: { en: ["session", "sessions"], fr: ["séance", "séances"] },
};

/**
 * A line's quantity in what it counts: "10 sessions" on screen, "10
 * séances" on the PDF; the number alone on a line without a unit. Numbers
 * are written like her amounts ("2,5", "1 200"); in French under 2 is
 * singular ("1,5 séance").
 */
export function quantityOf(quantity: number | string, unit: ProductUnit | null | undefined, language: "en" | "fr" = "en") {
	const n = Number(quantity);
	const number = n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/\u202F/g, "\u00A0");
	if (!unit) return number;
	const [one, many] = UNITS[unit][language];
	const singular = language === "fr" ? Math.abs(n) < 2 : n === 1;
	return `${number} ${singular ? one : many}`;
}

/** Whether a line's words still name the product (accents and capitals aside). */
export function namesProduct(description: string, productName: string) {
	const words = fold(description);
	return words !== "" && words.includes(fold(productName));
}

type LineLink = { productId: string | null; unit: ProductUnit | null };
const NONE: LineLink = { productId: null, unit: null };

/**
 * The product a line sells, and what its quantity counts, as it's saved.
 * - An invoice's (or credit note's) line sells what its source line sold,
 *   whatever it's called now.
 * - A line she picked from her price list keeps the product while its
 *   words still name it; written over as something else, it's her own line.
 */
export function lineProduct(
	line: { description: string; productId?: string | null; sourceLineId?: string | null },
	source: { productId: string | null; unit: ProductUnit | null } | undefined,
	product: { id: string; name: string; unit: ProductUnit | null } | undefined,
): LineLink {
	if (line.sourceLineId) return source ? { productId: source.productId, unit: source.unit } : NONE;
	if (!line.productId || !product || product.id !== line.productId) return NONE;
	return namesProduct(line.description, product.name) ? { productId: product.id, unit: product.unit } : NONE;
}
