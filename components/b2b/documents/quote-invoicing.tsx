import Link from "next/link";

import { documentName } from "@/lib/domain/billing/document-name";
import { displayStatus, documentAmounts } from "@/lib/domain/billing/payments";
import { billsTheQuote, type QuoteBalance } from "@/lib/domain/billing/quote-billing";
import { type DocumentWithRelations } from "@/lib/types/b2b";
import { formatMoney } from "@/lib/utils/currency";
import { studioDateString } from "@/lib/utils/time";

import { DocumentSection } from "./document-section";
import { DocumentStatusBadge } from "./status-badge";

/**
 * A quotation billed over time: how much of it is invoiced, what's left,
 * and its invoices one by one (drafts included: they're already promised).
 */
export function QuoteInvoicing({ balance, invoices }: { balance: QuoteBalance; invoices: DocumentWithRelations[] }) {
	const today = studioDateString();
	const share = balance.quoted > 0 ? Math.min(1, balance.billed / balance.quoted) : 0;

	return (
		<DocumentSection
			id="invoicing"
			title="Invoicing"
			aside={
				<p className="text-muted-foreground text-sm">
					{balance.remaining > 0 ? `${formatMoney(balance.remaining)} left to invoice` : "Fully invoiced"}
				</p>
			}
			className="animate-slide-up delay-100"
		>
			<div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
				<div className="grid gap-2 p-4">
					<div className="flex items-baseline justify-between gap-3 text-sm">
						<span className="font-semibold">
							{formatMoney(balance.billed)} invoiced of {formatMoney(balance.quoted)}
						</span>
						<span className="text-muted-foreground tabular-nums">{Math.round(share * 100)}%</span>
					</div>
					<div
						role="progressbar"
						aria-label="Invoiced so far"
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={Math.round(share * 100)}
						className="bg-secondary/60 h-2 overflow-hidden rounded-full"
					>
						<div className="bg-primary h-full rounded-full" style={{ width: `${share * 100}%` }} />
					</div>
				</div>
				<ul className="divide-border divide-y border-t">
					{invoices.map((invoice) => {
						const { total, due } = documentAmounts(invoice);
						return (
							// Two lines: the invoice and its amount, then where it stands.
							<li key={invoice.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-4 py-3">
								<Link
									href={`/b2b/documents/${invoice.id}`}
									className="hover:text-primary focus-visible:ring-ring truncate rounded-sm font-semibold outline-none focus-visible:ring-2"
								>
									{documentName(invoice)}
								</Link>
								<span className="text-right tabular-nums">
									{billsTheQuote(invoice) ? formatMoney(total) : <s className="text-muted-foreground">{formatMoney(total)}</s>}
								</span>
								<DocumentStatusBadge status={displayStatus(invoice, today)} />
								<span className="text-warning text-right text-sm tabular-nums">
									{due > 0 ? `${formatMoney(due)} to collect` : null}
								</span>
							</li>
						);
					})}
				</ul>
			</div>
		</DocumentSection>
	);
}
