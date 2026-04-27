import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DocumentWithRelations } from "@/lib/types/b2b";

import { format } from "date-fns";
import {
	DocumentText,
	TickCircle,
} from "iconsax-reactjs";

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
				className={`bg-card border-foreground/10 w-full border p-8 shadow-sm lg:max-w-md ${showStatementView ? "rounded-[2.5rem]" : "rounded-3xl"}`}
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

						{!showStatementView ? <Separator /> : null}
						<div className="flex w-full items-center justify-between">
							<span
								className={`font-heading text-xs font-bold tracking-[0.2em] uppercase ${showStatementView ? "text-foreground" : "text-primary"}`}
							>
								{showStatementView ? "Invoice Total" : "Total Amount"}
							</span>
							<span
								className={`font-heading ${showStatementView ? "text-foreground" : "text-primary"} text-3xl font-bold tracking-tight tabular-nums`}
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
					</div>
				</div>

				{/* Conditional Statement Sections */}
				{showStatementView ? (
					<>
						{/* SECTION B: Account Statement */}
						{previousInvoices.length > 0 ? (
							<div className="border-foreground/10 mt-4 space-y-5 border-t py-4">
								<div className="flex items-center justify-between">
									<h3 className="font-heading text-foreground text-xs font-bold tracking-[0.2em] uppercase">
										Account Statement
									</h3>
									<Badge className="border-amber-500/20 bg-amber-500/10 text-[9px] font-bold text-amber-600">
										Outstanding
									</Badge>
								</div>

								<div className="bg-secondary/20 border-secondary-2/70 overflow-hidden rounded-2xl border">
									<div className="divide-secondary-2/70 divide-y">
										{previousInvoices.map((inv) => (
											<Link
												key={inv.id}
												href={`/b2b/documents/${inv.id}`}
												className="hover:bg-secondary/40 group flex items-center justify-between px-5 py-3 transition-colors"
											>
												<div className="flex items-center gap-3">
													<div className="bg-secondary-2/20 group-hover:bg-secondary-2/30 flex size-8 items-center justify-center rounded-xl transition-colors">
														<DocumentText
															size={16}
															variant="Bulk"
															className="text-secondary-3 group-hover:text-secondary-foreground transition-colors"
														/>
													</div>
													<div className="flex flex-col">
														<span className="text-secondary-foreground text-xs font-bold">
															{inv.documentNumber}
														</span>
														<span className="text-muted-foreground/70 text-[9px] font-medium tracking-wider uppercase">
															{format(new Date(inv.issueDate), "MMM dd, yyyy")}
														</span>
													</div>
												</div>
												<div className="text-right">
													<span className="font-heading text-secondary-foreground text-sm font-bold tabular-nums">
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
									<div className="bg-secondary/40 border-secondary-2/70 flex items-center justify-between border-t px-5 py-2">
										<span className="text-primary text-xs font-bold tracking-widest uppercase">
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
								<span className="font-heading text-primary text-sm font-black tracking-[0.2em] uppercase">
									Total Amount Due
								</span>
							</div>
							<span className="font-heading text-primary text-4xl font-black tracking-tighter tabular-nums">
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
