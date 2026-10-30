"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { addQuantities, findSameLine } from "@/lib/domain/billing/same-lines";

type Line = { description: string; quantity: string; unitPrice: string; totalPrice: string; sourceLineId?: string | null };

export type LineColumn = "description" | "quantity" | "unitPrice";

export const blankLine = (): Line => ({ description: "", quantity: "1", unitPrice: "0", totalPrice: "0" });

/** A line with nothing in it yet: the one waiting at the end, or one she emptied. */
export const isBlankLine = (line?: Pick<Line, "description" | "unitPrice">) =>
	!line || (!line.description?.trim() && !(Number(line.unitPrice) > 0));

/** Marks a cell so the keyboard can move to it (data-line / data-col). */
export const cellProps = (row: number, column: LineColumn) => ({ "data-line": row, "data-col": column });

export function focusCell(row: number, column: LineColumn) {
	document.querySelector<HTMLInputElement>(`[data-line="${row}"][data-col="${column}"]`)?.focus();
}

/**
 * Lines that write themselves, the way invoice editors work: an empty line
 * is always waiting at the end of the table, and typing in it fills it in
 * place while a new empty one appears below (the cursor never jumps, so
 * nothing typed is lost). Enter moves across (description → quantity →
 * price → the next line); Backspace in an emptied line removes it. Empty
 * lines are dropped before saving (withoutBlankLines).
 *
 * The same item never takes two lines: picking a price already on the
 * document, or leaving a line written the same as another, adds its
 * quantity to that line instead (see same-lines), which lights up a moment.
 */
export function useFluidLines({
	count,
	lines,
	ids,
	getLines,
	setQuantity,
	append,
	remove,
}: {
	count: number;
	lines: Line[] | undefined;
	/** The rows' keys (useFieldArray's field ids), to light up the line that grew. */
	ids: string[];
	/** The lines as they are now (form.getValues), not as last rendered. */
	getLines: () => Line[];
	setQuantity: (index: number, quantity: string) => void;
	append: (line: Line, options: { shouldFocus: boolean }) => void;
	remove: (index: number) => void;
}) {
	// Re-checked when the rows change or the last one fills in. The check
	// reads the form as it is now: the watched values can lag a render behind
	// an append or a removal, and in development the effect runs twice, so
	// only the form itself says whether a waiting line is already there.
	const lastIsBlank = isBlankLine(lines?.[count - 1]);
	const latestLines = useRef(getLines);
	useEffect(() => {
		latestLines.current = getLines;
	});
	useEffect(() => {
		const current = latestLines.current();
		if (!current.length || !isBlankLine(current[current.length - 1])) {
			append(blankLine(), { shouldFocus: false });
		}
	}, [count, lastIsBlank, append]);

	const isWaiting = (index: number) => index === count - 1 && isBlankLine(lines?.[index]);

	const removeLine = useCallback(
		(index: number) => {
			remove(index);
			// The rows re-render first; then the line above takes the cursor.
			setTimeout(() => focusCell(Math.max(0, index - 1), "description"));
		},
		[remove],
	);

	const keyDown = (index: number, column: LineColumn) => (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			event.preventDefault();
			if (column === "description") focusCell(index, "quantity");
			else if (column === "quantity") focusCell(index, "unitPrice");
			else focusCell(Math.min(index + 1, count - 1), "description");
			return;
		}
		if (
			event.key === "Backspace" &&
			column === "description" &&
			!event.currentTarget.value &&
			!isWaiting(index) &&
			isBlankLine(lines?.[index])
		) {
			event.preventDefault();
			removeLine(index);
		}
	};

	/** Puts the cursor in the waiting line (a notice's "Add a line"). */
	const focusWaiting = () => focusCell(count - 1, "description");

	// The line that just grew, and what screen readers hear about it.
	const [grown, setGrown] = useState<{ id: string; message: string } | null>(null);
	const grownTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	useEffect(() => () => clearTimeout(grownTimer.current), []);

	/**
	 * Folds line `index` into the same item elsewhere, if there is one, and
	 * returns where that line is afterwards (-1 when nothing was the same).
	 * `picked` is a price just chosen for the line: then the line already
	 * there stays and this one goes (the waiting line, if picked from before
	 * a word was typed, simply keeps waiting). Leaving a line keeps the upper
	 * of the two.
	 */
	const mergeLine = (index: number, picked?: Pick<Line, "description" | "unitPrice">) => {
		const current = getLines();
		const line = { ...current[index], ...picked };
		const same = findSameLine(current, line, index);
		if (same < 0) return -1;
		const keep = picked ? same : Math.min(same, index);
		const drop = keep === same ? index : same;
		const quantity = addQuantities(current[same].quantity, line.quantity);
		setQuantity(keep, quantity);
		if (!(picked && isBlankLine(current[index]))) remove(drop);
		clearTimeout(grownTimer.current);
		setGrown({ id: ids[keep], message: `${line.description.trim()} was already there: quantity ${quantity}.` });
		grownTimer.current = setTimeout(() => setGrown(null), 1400);
		return drop < keep ? keep - 1 : keep;
	};

	/** For a row's onBlur: once the cursor leaves the line, a repeat of another merges into it. */
	const leaveLine = (index: number) => (event: React.FocusEvent<HTMLElement>) => {
		if (!event.currentTarget.contains(event.relatedTarget as Node | null)) mergeLine(index);
	};

	return {
		isWaiting,
		removeLine,
		keyDown,
		focusWaiting,
		mergeLine,
		leaveLine,
		/** The id of the row that just took a repeat's quantity. */
		grownId: grown?.id ?? null,
		/** Said politely to screen readers when a repeat merges. */
		announcement: grown?.message ?? "",
	};
}
