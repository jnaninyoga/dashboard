// The same item never sits on two lines of a document: a second
// "Famille (3–5 pax)" at 450 adds to the first line's quantity instead.

import { fold } from "./price-list";

type Line = {
	description: string;
	quantity: string;
	unitPrice: string;
	sourceLineId?: string | null;
	productId?: string | null;
	unit?: string | null;
};

/**
 * Two lines are the same item when their words match (accents and capitals
 * aside), at the same price, for the same quotation line (an invoice's
 * lines each track what's left of one quotation line, so those stay apart),
 * and they don't sell two different products of her price list. Empty
 * lines, and lines without a quantity yet, are never the same item.
 */
function sameItem(a: Line, b: Line) {
	const filled = (line: Line) => fold(line.description) !== "" && Number(line.quantity) > 0;
	return (
		filled(a) &&
		filled(b) &&
		fold(a.description) === fold(b.description) &&
		Number(a.unitPrice) === Number(b.unitPrice) &&
		(a.sourceLineId ?? null) === (b.sourceLineId ?? null) &&
		(!a.productId || !b.productId || a.productId === b.productId)
	);
}

/** The first line, other than the one at `except`, that is the same item as `line`; -1 if none. */
export function findSameLine(lines: Line[], line: Line, except: number) {
	return lines.findIndex((other, index) => index !== except && sameItem(other, line));
}

/** Two quantities added, to the cent (as they're stored). */
export function addQuantities(a: string, b: string) {
	return String(Math.round((Number(a) + Number(b)) * 100) / 100);
}

/**
 * The lines with each item once: a repeat's quantity goes to the first line
 * of it, which keeps the product either of them was picked as.
 */
export function mergeSameLines<T extends Line>(lines: T[]): T[] {
	const merged: T[] = [];
	for (const line of lines) {
		const same = findSameLine(merged, line, -1);
		if (same < 0) {
			merged.push(line);
			continue;
		}
		const first = merged[same];
		merged[same] = {
			...first,
			quantity: addQuantities(first.quantity, line.quantity),
			...(first.productId || !line.productId ? null : { productId: line.productId, unit: line.unit }),
		};
	}
	return merged;
}
