import Link from "next/link";

import { type QuoteTape } from "@/lib/domain/billing/quote-tape";
import { formatMoney } from "@/lib/utils/currency";

import { ArrowRight2 } from "iconsax-reactjs";

import { BillingTape, PieceMark, PieceStatus, pieceStory, TapeLegend } from "./billing-tape";
import { DocumentSection } from "./document-section";

/**
 * A quotation billed over time: its tape (what's invoiced, collected,
 * waiting, left), then its invoices in the order they were issued, each a
 * tap away.
 */
export function QuoteInvoicing({ tape }: { tape: QuoteTape }) {
	return (
		<DocumentSection
			id="invoicing"
			title="Invoicing"
			aside={
				<p className="text-sm text-muted-foreground">
					{tape.left > 0 ? `${formatMoney(tape.left)} left to invoice` : "Fully invoiced"}
				</p>
			}
			className="animate-slide-up delay-100"
		>
			<div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
				<div className="grid gap-4 p-5">
					<p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
						<span className="font-heading text-2xl font-semibold text-foreground tabular-nums">
							{formatMoney(tape.invoiced)}
						</span>
						<span className="text-muted-foreground">invoiced of {formatMoney(tape.quoted)}</span>
					</p>
					<BillingTape tape={tape} />
					<TapeLegend tape={tape} />
				</div>
				<ol className="divide-y divide-border border-t">
					{tape.pieces.map((piece) => (
						<li key={piece.id}>
							<Link
								href={`/b2b/documents/${piece.id}`}
								className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 px-4 py-3.5 transition-colors outline-none hover:bg-secondary/30 focus-visible:bg-secondary/30 sm:px-5"
							>
								<PieceMark piece={piece} className="row-span-2 max-sm:w-6" />
								<span className="truncate font-semibold transition-colors group-hover:text-primary">{piece.name}</span>
								<span className="flex items-center justify-end gap-1 font-medium tabular-nums">
									{formatMoney(piece.total)}
									<ArrowRight2 size={14} aria-hidden className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
								</span>
								{/* Its dates and what it still asks for share a line, wrapping
								    on a phone, so the name keeps the room it needs. */}
								<span className="col-span-2 flex flex-wrap items-baseline justify-between gap-x-3">
									<span className="text-sm text-muted-foreground">{pieceStory(piece)}</span>
									<PieceStatus piece={piece} className="pr-[18px]" />
								</span>
							</Link>
						</li>
					))}
				</ol>
			</div>
		</DocumentSection>
	);
}
