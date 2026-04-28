import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { B2BPayment, DocumentWithRelations } from "@/lib/types/b2b";

import { format } from "date-fns";
import { ArrowRight, DocumentText, TickCircle } from "iconsax-reactjs";
import { cn } from "@/lib/utils/ui";

type ChainInvoice = DocumentWithRelations & { payments?: B2BPayment[] };

interface AccountStatementProps {
	invoices: ChainInvoice[];
	currentDocumentId: string;
}

function formatMoney(value: number) {
	return value.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export function AccountStatement({
	invoices,
	currentDocumentId,
}: AccountStatementProps) {
	const rows = invoices.map((inv) => {
		const total = Number(inv.totalAmount);
		const paid = (inv.payments ?? []).reduce(
			(sum, p) => sum + Number(p.amount),
			0,
		);
		const due = total - paid;
		return {
			invoice: inv,
			total,
			paid,
			due,
			isFullyPaid: due <= 0.005,
			isCurrent: inv.id === currentDocumentId,
		};
	});

	const chainTotal = rows.reduce((s, r) => s + r.total, 0);
	const chainPaid = rows.reduce((s, r) => s + r.paid, 0);
	const chainDue = rows.reduce((s, r) => s + r.due, 0);
	const chainCleared = chainDue <= 0.005;

	return (
		<div className="bg-card border-foreground/10 animate-slide-up w-full rounded-3xl border p-8 shadow-sm delay-200">
			<div className="space-y-5">
				<div className="flex items-center justify-between">
					<h3 className="font-heading text-foreground text-xs font-bold tracking-[0.2em] uppercase">
						Account Statement
					</h3>
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

				{/* Invoice cards */}
				<div className="space-y-3">
					{rows.map(
						({ invoice, total, paid, due, isFullyPaid, isCurrent }) => {
							const cardBaseClasses = cn("relative overflow-hidden rounded-2xl border px-4 py-3 transition-colors", {
								"border-primary/30 bg-primary/5": isCurrent,
								"border-secondary-2/40 bg-secondary/10": isFullyPaid,
								"border-secondary-2/70 bg-secondary/20": !isCurrent && !isFullyPaid
							});

							const header = (
								<div className="flex items-center justify-between gap-3">
									<div className="flex min-w-0 items-center gap-3">
										<div
											className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", {
												"bg-primary/15": isCurrent,
												"bg-green-500/10": isFullyPaid,
												"bg-secondary-2/20 group-hover:bg-primary/10 transition-colors": !isCurrent && !isFullyPaid
											})}
										>
											<DocumentText
												size={16}
												variant="Bulk"
												className={cn("transition-colors", {
													"text-primary": isCurrent,
													"text-green-600": isFullyPaid,
													"text-secondary-3 group-hover:text-primary transition-colors": !isCurrent && !isFullyPaid
												})}
											/>
										</div>
										<div className="flex min-w-0 flex-col">
											<span className={cn("truncate text-sm leading-tight font-bold transition-colors", isCurrent ? "text-primary" : "text-secondary-foreground group-hover:text-primary")}>
												{invoice.documentNumber}
											</span>
											<span className="text-muted-foreground/70 text-[10px] font-medium tracking-wider uppercase">
												{format(new Date(invoice.issueDate), "MMM dd, yyyy")}
											</span>
										</div>
									</div>

									<div className="flex shrink-0 items-center gap-2">
										{isCurrent ? (
											<span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase">
												Current
											</span>
										) : null}
										{isFullyPaid ? (
											<span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[9px] font-bold tracking-wider text-green-700 uppercase">
												<TickCircle size={10} variant="Bold" />
												Paid
											</span>
										) : null}
										{!isCurrent ? (
											<ArrowRight
												size={18}
												className="text-secondary-foreground group-hover:text-primary transition-colors"
											/>
										) : null}
									</div>
								</div>
							);

							const summaryRow = (
								<div className="mt-2 flex items-center justify-between gap-3">
									<div className="flex items-center gap-3 text-[10px] tracking-wider uppercase">
										<div className="flex items-baseline gap-1.5">
											<span className="text-muted-foreground/70 font-bold">
												Total
											</span>
											<span className="text-secondary-foreground font-heading text-xs font-bold tabular-nums">
												{formatMoney(total)}
											</span>
										</div>
										<span className="text-muted-foreground/30">·</span>
										<div className="flex items-baseline gap-1.5">
											<span className="text-muted-foreground/70 font-bold">
												Paid
											</span>
											<span
												className={cn("font-heading text-xs font-bold tabular-nums", {
													"text-green-600": paid > 0,
													"text-muted-foreground/60": paid === 0
												})}
											>
												{formatMoney(paid)}
											</span>
										</div>
									</div>
									<div className="flex items-baseline gap-1.5">
										<span className="text-muted-foreground/70 text-[9px] font-bold tracking-widest uppercase">
											{isFullyPaid ? "Settled" : "Due"}
										</span>
										<span
											className={cn("font-heading text-base font-bold tracking-tight tabular-nums", {
												"text-muted-foreground/60 line-through decoration-current/40 decoration-1": isFullyPaid,
												"text-primary": isCurrent,
												"text-secondary-foreground": !isFullyPaid && !isCurrent
											})}
										>
											{formatMoney(due)}
											<span className="ml-1 text-[9px] font-semibold opacity-60">
												MAD
											</span>
										</span>
									</div>
								</div>
							);

							const inner = (
								<>
									{header}
									{summaryRow}
								</>
							);

							if (isCurrent) {
								return (
									<div key={invoice.id} className={cardBaseClasses}>
										{inner}
									</div>
								);
							}

							return (
								<Link
									key={invoice.id}
									href={`/b2b/documents/${invoice.id}`}
									className={`group block ${cardBaseClasses} hover:border-primary/30 hover:bg-primary/5`}
								>
									{inner}
								</Link>
							);
						},
					)}
				</div>

				{/* Summary footer */}
				<div className="bg-secondary/30 border-secondary-2/50 mt-2 space-y-3 rounded-2xl border px-5 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-baseline gap-2">
							<span className="text-muted-foreground/80 text-[10px] font-bold tracking-widest uppercase">
								Chain Total
							</span>
							<span className="font-heading text-secondary-foreground text-base font-bold tabular-nums">
								{formatMoney(chainTotal)}
							</span>
						</div>
						<div className="flex items-baseline gap-2">
							<span className="text-muted-foreground/80 text-[10px] font-bold tracking-widest uppercase">
								Paid
							</span>
							<span className="font-heading text-base font-bold text-green-600 tabular-nums">
								{formatMoney(chainPaid)}
							</span>
						</div>
					</div>
					<div className="border-secondary-2/50 flex items-end justify-between border-t pt-3">
						<span className="font-heading text-primary text-xs font-bold tracking-[0.2em] uppercase">
							{chainCleared ? "Total Cleared" : "Total Due"}
						</span>
						<span
							className={cn("font-heading text-2xl font-bold tracking-tight tabular-nums", {
								"text-green-600": chainCleared,
								"text-primary": !chainCleared
							})}
						>
							{formatMoney(chainDue)}
							<span className="ml-1.5 text-xs font-semibold opacity-60">
								MAD
							</span>
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
