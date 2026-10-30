"use client";

import { useCallback, useEffect, useRef } from "react";

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
 */
export function useFluidLines({
	count,
	lines,
	append,
	remove,
}: {
	count: number;
	lines: Line[] | undefined;
	append: (line: Line, options: { shouldFocus: boolean }) => void;
	remove: (index: number) => void;
}) {
	// The row at the end of the list: right after an append the watched values
	// can still be one line short, and their last line isn't the last row.
	const lastIsBlank = isBlankLine(lines?.[count - 1]);
	// Once per line count (effects run twice on mount in development).
	const addedAt = useRef(-1);
	useEffect(() => {
		if ((!count || !lastIsBlank) && addedAt.current !== count) {
			addedAt.current = count;
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

	/** Puts the cursor in the waiting line ("Add item"). */
	const focusWaiting = () => focusCell(count - 1, "description");

	return { isWaiting, removeLine, keyDown, focusWaiting };
}
