import Link from "next/link";

import { documentName } from "@/lib/domain/billing/document-name";
import { type QuoteTape } from "@/lib/domain/billing/quote-tape";
import { formatMoney } from "@/lib/utils/currency";

import { ArrowRight2 } from "iconsax-reactjs";

import { BillingTape, PieceMark, PieceStatus } from "./billing-tape";

/**
 * Where an invoice comes from: its quotation's tape with this invoice
 * standing out, and the quotation's other invoices a tap away.
 */
export function InvoiceOrigin({
	invoiceId,
	quote,
	tape,
}: {
	invoiceId: string;
	quote: { id: string; type: string; documentNumber: string | null };
	tape: QuoteTape;
}) {
	const position = tape.pieces.findIndex((piece) => piece.id === invoiceId);
	const others = tape.pieces.filter((piece) => piece.id !== invoiceId);

	return (
		<section aria-label="Its quotation" className="grid animate-slide-up gap-3 rounded-2xl border bg-card p-4 shadow-sm delay-75 sm:p-5">
			<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
				<p>
					<span className="text-muted-foreground">
						{position >= 0 ? `Invoice ${position + 1} of ${tape.pieces.length} from ` : "From "}
					</span>
					<Link
						href={`/b2b/documents/${quote.id}`}
						className="rounded-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
					>
						{documentName(quote)}
					</Link>
				</p>
				<p className="text-sm text-muted-foreground tabular-nums">
					{formatMoney(tape.invoiced)} of {formatMoney(tape.quoted)} invoiced
					{tape.left > 0 ? ` · ${formatMoney(tape.left)} left` : ""}
				</p>
			</div>
			<BillingTape tape={tape} currentId={invoiceId} />
			{others.length ? (
				<ul className="flex flex-wrap gap-2">
					{others.map((piece) => (
						<li key={piece.id}>
							<Link
								href={`/b2b/documents/${piece.id}`}
								className="group flex min-h-10 items-center gap-2 rounded-full bg-secondary/40 py-1.5 pr-3 pl-2.5 text-sm outline-none hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-ring"
							>
								<PieceMark piece={piece} className="w-6" />
								<span className="font-semibold">{piece.name}</span>
								<PieceStatus piece={piece} />
								<ArrowRight2 size={14} aria-hidden className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
							</Link>
						</li>
					))}
				</ul>
			) : null}
		</section>
	);
}
