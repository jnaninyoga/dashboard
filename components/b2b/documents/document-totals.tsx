import { Separator } from "@/components/ui/separator";
import { documentName } from "@/lib/domain/billing/document-name";
import { DocumentWithRelations } from "@/lib/types/b2b";
import { formatAmount } from "@/lib/utils/currency";

import { TickCircle } from "iconsax-reactjs";

import { PaymentHistorySummary } from "./payment-history-dialog";

interface DocumentTotalsProps {
	document: DocumentWithRelations;
	currentTotal: number;
	amountPaid: number;
	amountDue: number;
	isQuote: boolean;
}

export function DocumentTotals({
	document,
	currentTotal,
	amountPaid,
	amountDue,
	isQuote,
}: DocumentTotalsProps) {
	const showAmountDue = !isQuote && amountPaid > 0 && amountDue > 0.005;

	return (
		<div className="bg-card border-foreground/10 w-full rounded-3xl border p-8 shadow-sm">
			<div className="space-y-4">
				<h3 className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-50">
					{isQuote ? "Quote Totals" : "Invoice Totals"}
				</h3>

				<div className="space-y-3">
					<div className="flex w-full items-center justify-between">
						<span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
							Subtotal
						</span>
						<span className="font-heading text-foreground text-lg font-bold tabular-nums">
							{formatAmount(parseFloat(document.subtotal))}
							<span className="text-muted-foreground/70 ml-1 text-xs font-normal">
								MAD
							</span>
						</span>
					</div>
					<div className="flex w-full items-center justify-between">
						<span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
							Tax ({parseFloat(document.taxRate)}%)
						</span>
						<span className="font-heading text-foreground text-lg font-bold tabular-nums">
							{formatAmount(parseFloat(document.subtotal) *
								(parseFloat(document.taxRate) / 100))}
							<span className="text-muted-foreground/70 ml-1 text-xs font-normal">
								MAD
							</span>
						</span>
					</div>

					<Separator />
					<div className="flex w-full items-center justify-between">
						<span
							className={`font-heading text-xs font-bold tracking-[0.2em] uppercase ${showAmountDue ? "text-foreground" : "text-primary"}`}
						>
							{isQuote ? "Quote Total" : "Invoice Total"}
						</span>
						<span
							className={`font-heading ${showAmountDue ? "text-foreground" : "text-primary"} text-3xl font-bold tracking-tight tabular-nums`}
						>
							{formatAmount(currentTotal)}
							<span className="ml-1.5 text-sm font-semibold opacity-60">
								MAD
							</span>
						</span>
					</div>

					{document.payments && document.payments.length > 0 ? (
						<PaymentHistorySummary
							payments={document.payments}
							documentNumber={documentName(document)}
						/>
					) : null}

					{showAmountDue ? (
						<>
							<Separator />
							<div className="flex w-full items-center justify-between">
								<span className="font-heading text-primary text-xs font-bold tracking-[0.2em] uppercase">
									Amount Due
								</span>
								<span className="font-heading text-primary text-3xl font-bold tracking-tight tabular-nums">
									{formatAmount(amountDue)}
									<span className="ml-1.5 text-sm font-semibold opacity-60">
										MAD
									</span>
								</span>
							</div>
						</>
					) : null}

					{!isQuote && amountPaid > 0 && amountDue <= 0.005 ? (
						<>
							<Separator />
							<div className="flex w-full items-center justify-between">
								<span className="font-heading text-success text-xs font-bold tracking-[0.2em] uppercase">
									Fully Paid
								</span>
								<div className="bg-success/15 flex size-7 items-center justify-center rounded-full">
									<TickCircle
										size={18}
										variant="Bold"
										className="text-success"
									/>
								</div>
							</div>
						</>
					) : null}
				</div>
			</div>
		</div>
	);
}
