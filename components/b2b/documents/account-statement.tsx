import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
	Clock,
	DocumentText,
	Link1,
	ReceiptText,
	TickCircle,
} from "iconsax-reactjs";
import { B2BDocument, DocumentWithRelations } from "@/lib/types/b2b";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

interface AccountStatementProps {
	document: DocumentWithRelations;
	previousInvoices: any[];
	previousBalance: number;
	currentTotal: number;
	amountPaid: number;
	totalAmountDue: number;
	isQuote: boolean;
}

export function AccountStatement({
	document,
	previousInvoices,
	previousBalance,
	currentTotal,
	amountPaid,
	totalAmountDue,
	isQuote,
}: AccountStatementProps) {
	const hasPartialPayment = amountPaid > 0;
	const hasPreviousDebt = previousInvoices.length > 0;
	const showStatementView =
		(hasPartialPayment || hasPreviousDebt) && document.type === "invoice";

	return (
		<div className="animate-slide-up flex flex-col gap-8 delay-200 lg:flex-row lg:justify-end">
			<div
				className={`bg-card w-full border border-foreground/10 shadow-sm p-8 lg:max-w-md ${showStatementView ? "rounded-[2.5rem]" : "rounded-3xl"}`}
			>
				{/* SECTION A: Standard Invoice Totals */}
				<div className="space-y-4">
					{!showStatementView && (
						<h3 className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-50">
							{isQuote ? "Quote Totals" : "Invoice Totals"}
						</h3>
					)}

					<div className="space-y-3">
						<div className="flex w-full items-center justify-between">
							<span className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
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
							<span className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
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

						{!showStatementView ? <Separator /> : null}
						<div className="flex w-full items-center justify-between">
							<span
								className={`font-heading text-xs font-bold uppercase tracking-[0.2em] ${showStatementView ? "text-foreground" : "text-primary"}`}
							>
								{showStatementView ? "Invoice Total" : "Total Amount"}
							</span>
							<span
								className={`font-heading ${showStatementView ? "text-foreground" : "text-primary"} text-3xl font-bold tabular-nums tracking-tight`}
							>
								{currentTotal.toLocaleString(undefined, {
									minimumFractionDigits: 2,
								})}
								<span className="ml-1.5 text-sm font-semibold opacity-60">
									MAD
								</span>
							</span>
						</div>

						{/* Payment History (Granular Records) */}
						{document.payments && document.payments.length > 0 ? (
							<div className="space-y-3 animate-in fade-in slide-in-from-top-1 mt-4 border-t border-dashed border-foreground/15 py-3">
								{document.payments.map((payment) => (
									<div
										key={payment.id}
										className="flex w-full items-center justify-between"
									>
										<div className="flex items-center gap-2">
											<div className="size-5 rounded-full bg-green-500/10 flex items-center justify-center">
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
										<span className="font-heading text-green-600 font-bold tabular-nums">
											- {parseFloat(payment.amount).toLocaleString()}
											<span className="ml-1 text-xs font-normal opacity-60">
												MAD
											</span>
										</span>
									</div>
								))}
							</div>
						) : null}
					</div>
				</div>

				{/* Conditional Statement Sections */}
				{showStatementView ? (
					<>
						{/* SECTION B: Account Statement */}
						{previousInvoices.length > 0 ? (
							<div className="space-y-5 border-t border-foreground/10 py-4 mt-4">
								<div className="flex items-center justify-between">
									<h3 className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-foreground">
										Account Statement
									</h3>
									<Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] font-bold">
										Outstanding
									</Badge>
								</div>

								<div className="bg-secondary/20 rounded-2xl border border-secondary-2/70 overflow-hidden">
									<div className="divide-y divide-secondary-2/70">
										{previousInvoices.map((inv) => (
											<Link
												key={inv.id}
												href={`/b2b/documents/${inv.id}`}
												className="flex items-center justify-between px-5 py-3 hover:bg-secondary/40 transition-colors group"
											>
												<div className="flex items-center gap-3">
													<div className="size-8 rounded-xl bg-secondary-2/20 flex items-center justify-center group-hover:bg-secondary-2/30 transition-colors">
														<DocumentText
															size={16}
															variant="Bulk"
															className="text-secondary-3 group-hover:text-secondary-foreground transition-colors"
														/>
													</div>
													<div className="flex flex-col">
														<span className="text-xs font-bold text-secondary-foreground">
															{inv.documentNumber}
														</span>
														<span className="text-[9px] font-medium text-muted-foreground/70 uppercase tracking-wider">
															{format(new Date(inv.issueDate), "MMM dd, yyyy")}
														</span>
													</div>
												</div>
												<div className="text-right">
													<span className="font-heading text-sm font-bold text-secondary-foreground tabular-nums">
														{(
															Number(inv.totalAmount) -
															(inv.payments || []).reduce(
																(sum: number, p: any) => sum + Number(p.amount),
																0,
															)
														).toLocaleString(undefined, {
															minimumFractionDigits: 2,
														})}
														<span className="ml-1 text-[10px] font-normal opacity-60">
															MAD
														</span>
													</span>
												</div>
											</Link>
										))}
									</div>
									<div className="bg-secondary/40 flex items-center justify-between px-5 py-2 border-t border-secondary-2/70">
										<span className="text-xs font-bold uppercase tracking-widest text-primary">
											Accumulated Debt
										</span>
										<span className="font-heading text-primary font-bold tabular-nums">
											{previousBalance.toLocaleString(undefined, {
												minimumFractionDigits: 2,
											})}
											<span className="ml-1 text-sm font-normal opacity-60">
												MAD
											</span>
										</span>
									</div>
								</div>
							</div>
						) : null}

						{/* SECTION C: Grand Total */}
						<Separator />
						<div className="mt-4 flex w-full items-center justify-between">
							<div className="flex flex-col text-left">
								<span className="font-heading text-sm font-black uppercase tracking-[0.2em] text-primary">
									Total Amount Due
								</span>
							</div>
							<span className="font-heading text-primary text-4xl font-black tabular-nums tracking-tighter">
								{(totalAmountDue - amountPaid).toLocaleString(undefined, {
									minimumFractionDigits: 2,
								})}
								<span className="ml-1.5 text-xs font-bold opacity-40">MAD</span>
							</span>
						</div>
					</>
				) : null}
			</div>
		</div>
	);
}
