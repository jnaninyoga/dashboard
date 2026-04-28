import { Separator } from "@/components/ui/separator";
import { DocumentWithRelations } from "@/lib/types/b2b";

import { format } from "date-fns";
import { TickCircle } from "iconsax-reactjs";

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
							{parseFloat(document.subtotal).toLocaleString()}
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
							{(
								parseFloat(document.subtotal) *
								(parseFloat(document.taxRate) / 100)
							).toLocaleString(undefined, {
								minimumFractionDigits: 0,
								maximumFractionDigits: 2,
							})}
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
							{currentTotal.toLocaleString(undefined, {
								minimumFractionDigits: 2,
							})}
							<span className="ml-1.5 text-sm font-semibold opacity-60">
								MAD
							</span>
						</span>
					</div>

					{document.payments && document.payments.length > 0 ? (
						<div className="animate-in fade-in slide-in-from-top-1 border-foreground/15 mt-4 space-y-3 border-t border-dashed py-3">
							{document.payments.map((payment) => (
								<div
									key={payment.id}
									className="flex w-full items-center justify-between"
								>
									<div className="flex items-center gap-2">
										<div className="flex size-5 items-center justify-center rounded-full bg-green-500/10">
											<TickCircle
												size={12}
												variant="Bold"
												className="text-green-600"
											/>
										</div>
										<span className="text-xs font-bold text-emerald-700 italic">
											Paid on{" "}
											{format(new Date(payment.paymentDate), "MM/dd/yyyy")}
										</span>
									</div>
									<span className="font-heading font-bold text-green-600 tabular-nums">
										- {parseFloat(payment.amount).toLocaleString()}
										<span className="ml-1 text-xs font-normal opacity-60">
											MAD
										</span>
									</span>
								</div>
							))}
						</div>
					) : null}

					{showAmountDue ? (
						<>
							<Separator />
							<div className="flex w-full items-center justify-between">
								<span className="font-heading text-primary text-xs font-bold tracking-[0.2em] uppercase">
									Amount Due
								</span>
								<span className="font-heading text-primary text-3xl font-bold tracking-tight tabular-nums">
									{amountDue.toLocaleString(undefined, {
										minimumFractionDigits: 2,
									})}
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
								<span className="font-heading text-xs font-bold tracking-[0.2em] text-green-700 uppercase">
									Fully Paid
								</span>
								<div className="flex size-7 items-center justify-center rounded-full bg-green-500/15">
									<TickCircle
										size={18}
										variant="Bold"
										className="text-green-600"
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
