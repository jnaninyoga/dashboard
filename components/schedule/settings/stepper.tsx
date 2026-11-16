"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/ui";

import { Add, Minus } from "iconsax-reactjs";

/** Lengths and rests move by a quarter of an hour. */
export const STEP = 15;

/** − value +, big enough for a thumb; the value (and what it means, under it) is read out when it changes. */
export function Stepper({
	label,
	value,
	note,
	quiet,
	onLess,
	onMore,
	lessDisabled,
}: {
	label: string;
	value: string;
	note?: string;
	/** A rest: dashed and see-through, as the gaps are on the bar. */
	quiet?: boolean;
	onLess: () => void;
	onMore: () => void;
	lessDisabled?: boolean;
}) {
	return (
		<div role="group" aria-label={label} className={cn("inline-flex h-11 shrink-0 items-center rounded-full border", quiet ? "border-dashed" : "bg-background")}>
			<Button type="button" variant="ghost" size="icon" aria-label={`${label}: ${STEP} min less`} onClick={onLess} disabled={lessDisabled} className="size-11 rounded-full">
				<Minus size={18} />
			</Button>
			<span aria-live="polite" className="grid min-w-12 justify-items-center text-sm leading-tight font-semibold tabular-nums">
				{value}
				{note ? <span className="text-[0.6875rem] font-normal text-muted-foreground">{note}</span> : null}
			</span>
			<Button type="button" variant="ghost" size="icon" aria-label={`${label}: ${STEP} min more`} onClick={onMore} className="size-11 rounded-full">
				<Add size={18} />
			</Button>
		</div>
	);
}
