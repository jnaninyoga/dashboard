"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils/ui";

import { ArrowRight, Link21 } from "iconsax-reactjs";

import {
	ChainInvoice,
	ChainInvoiceCards,
	ChainSummaryFooter,
	computeChain,
} from "./account-statement";

interface ChainStripProps {
	invoices: ChainInvoice[];
	currentDocumentId: string;
	partnerName?: string | null;
}

const DOT_LIMIT = 8;

function formatMoney(value: number) {
	return value.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export function ChainStrip({
	invoices,
	currentDocumentId,
	partnerName,
}: ChainStripProps) {
	const [open, setOpen] = useState(false);

	if (invoices.length <= 1) return null;

	const chain = computeChain(invoices, currentDocumentId);
	const {
		rows,
		chainTotal,
		chainPaid,
		chainDue,
		chainCleared,
		settledCount,
		totalCount,
		currentIndex,
	} = chain;

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="bg-card border-foreground/10 hover:border-primary/30 hover:bg-accent/40 group animate-slide-up flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-3 shadow-sm transition-colors"
			>
				<div className="flex min-w-0 items-center gap-3">
					<div
						className={cn(
							"flex size-9 shrink-0 items-center justify-center rounded-xl",
							chainCleared
								? "bg-green-500/15 text-green-600"
								: "bg-primary/15 text-primary",
						)}
					>
						<Link21 size={18} variant="Bulk" />
					</div>
					<div className="flex min-w-0 flex-col items-start leading-tight">
						<span className="text-foreground text-[10px] font-bold tracking-widest uppercase">
							Backorder Chain
						</span>
						<span className="text-muted-foreground/80 truncate text-xs font-medium">
							Invoice {currentIndex + 1} of {totalCount} &middot;{" "}
							{settledCount} settled
						</span>
					</div>
				</div>

				{totalCount <= DOT_LIMIT ? (
					<div className="hidden items-center gap-1.5 sm:flex">
						{rows.map(({ invoice, isCurrent, isFullyPaid }, i) => (
							<span
								key={invoice.id}
								className={cn(
									"block rounded-full transition-all",
									isCurrent
										? "ring-primary/40 size-2.5 ring-2 ring-offset-1 ring-offset-transparent"
										: "size-2",
									isFullyPaid
										? "bg-green-500"
										: isCurrent
											? "bg-primary"
											: "bg-muted-foreground/25",
								)}
								aria-label={`Invoice ${i + 1}${isCurrent ? " (current)" : ""}${isFullyPaid ? " — paid" : ""}`}
							/>
						))}
					</div>
				) : null}

				<div className="flex shrink-0 items-center gap-2">
					{chainCleared ? (
						<span className="font-heading text-sm font-bold tracking-wider text-green-600 uppercase">
							Cleared
						</span>
					) : (
						<>
							<span className="text-muted-foreground/70 text-[10px] font-bold tracking-widest uppercase">
								Due
							</span>
							<span className="font-heading text-primary text-base font-bold tabular-nums">
								{formatMoney(chainDue)}
								<span className="ml-1 text-[10px] font-semibold opacity-60">
									MAD
								</span>
							</span>
						</>
					)}
					<ArrowRight
						size={16}
						className="text-muted-foreground/50 group-hover:text-primary transition-all group-hover:translate-x-0.5"
					/>
				</div>
			</button>

			<Sheet open={open} onOpenChange={setOpen}>
				<SheetContent
					side="right"
					className="bg-card flex w-full flex-col gap-0 p-0 sm:max-w-140"
				>
					<SheetHeader className="border-foreground/10 shrink-0 gap-3 border-b px-8 py-6">
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								<div
									className={cn(
										"flex size-10 items-center justify-center rounded-2xl",
										chainCleared
											? "bg-green-500/15 text-green-600"
											: "bg-primary/15 text-primary",
									)}
								>
									<Link21 size={20} variant="Bulk" />
								</div>
								<div className="min-w-0">
									<SheetTitle className="font-heading text-lg font-bold tracking-tight">
										Backorder Chain
									</SheetTitle>
									<SheetDescription className="text-xs">
										{partnerName ? `${partnerName} · ` : ""}
										{totalCount} invoices &middot; {settledCount} settled
									</SheetDescription>
								</div>
							</div>
							{chainCleared ? (
								<Badge className="border-green-500/20 bg-green-500/10 text-[9px] font-bold text-green-600">
									Cleared
								</Badge>
							) : (
								<Badge className="border-amber-500/20 bg-amber-500/10 text-[9px] font-bold text-amber-600">
									Outstanding
								</Badge>
							)}
						</div>
					</SheetHeader>

					<div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
						<ChainInvoiceCards rows={rows} />
					</div>

					<div className="bg-card border-foreground/10 shrink-0 border-t px-6 py-4">
						<ChainSummaryFooter
							chainTotal={chainTotal}
							chainPaid={chainPaid}
							chainDue={chainDue}
							chainCleared={chainCleared}
						/>
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}
