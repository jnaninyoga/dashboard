"use client";

import { useState } from "react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { B2BPayment } from "@/lib/types/b2b";

import { format } from "date-fns";
import { ArrowRight, MoneyTime, Receipt2, TickCircle } from "iconsax-reactjs";

interface PaymentHistorySummaryProps {
	payments: B2BPayment[];
	documentNumber: string;
}

function formatMoney(value: number) {
	return value.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export function PaymentHistorySummary({
	payments,
	documentNumber,
}: PaymentHistorySummaryProps) {
	const [open, setOpen] = useState(false);

	if (!payments || payments.length === 0) return null;

	const sorted = [...payments].sort(
		(a, b) =>
			new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
	);
	const totalPaid = sorted.reduce((s, p) => s + parseFloat(p.amount), 0);
	const lastPayment = sorted[0];
	const count = sorted.length;

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="animate-in fade-in slide-in-from-top-1 border-foreground/15 hover:bg-green-500/5 group mt-4 flex w-full items-center justify-between rounded-xl border border-dashed py-3 pr-3 pl-2 transition-colors"
			>
				<div className="flex items-center gap-2">
					<div className="flex size-7 items-center justify-center rounded-full bg-green-500/10">
						<TickCircle
							size={14}
							variant="Bold"
							className="text-green-600"
						/>
					</div>
					<div className="flex flex-col items-start leading-tight">
						<span className="text-xs font-bold text-emerald-700 italic">
							Paid
						</span>
						<span className="text-muted-foreground/70 text-[10px] font-medium tracking-wider uppercase">
							{count} payment{count > 1 ? "s" : ""} &middot; last{" "}
							{format(new Date(lastPayment.paymentDate), "MMM dd, yyyy")}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<span className="font-heading font-bold text-green-600 tabular-nums">
						- {formatMoney(totalPaid)}
						<span className="ml-1 text-xs font-normal opacity-60">MAD</span>
					</span>
					<ArrowRight
						size={14}
						className="text-muted-foreground/40 group-hover:text-primary transition-colors"
					/>
				</div>
			</button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="zen-shadow-lg overflow-hidden rounded-3xl border-none p-0 sm:max-w-[480px]">
					<DialogHeader className="bg-card border-b p-8 pb-6">
						<div className="flex items-center gap-4">
							<div className="flex size-12 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-green-600">
								<Receipt2 size={24} variant="Bulk" />
							</div>
							<div className="min-w-0">
								<DialogTitle className="truncate text-xl font-bold tracking-tight">
									Payment History
								</DialogTitle>
								<DialogDescription>
									{count} payment{count > 1 ? "s" : ""} recorded against{" "}
									{documentNumber}.
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="space-y-5 p-8">
						<div className="bg-secondary/20 border-secondary-2/70 flex items-end justify-between rounded-2xl border px-5 py-4">
							<div className="flex flex-col leading-tight">
								<span className="text-muted-foreground/80 text-[10px] font-bold tracking-widest uppercase">
									Total Paid
								</span>
								<span className="text-muted-foreground/60 text-[10px] font-medium">
									Across {count} payment{count > 1 ? "s" : ""}
								</span>
							</div>
							<span className="font-heading text-2xl font-bold tracking-tight text-green-600 tabular-nums">
								{formatMoney(totalPaid)}
								<span className="ml-1.5 text-xs font-semibold opacity-60">
									MAD
								</span>
							</span>
						</div>

						<div className="relative max-h-[360px] space-y-3 overflow-y-auto pr-1">
							{sorted.map((payment, idx) => (
								<div
									key={payment.id}
									className="bg-secondary/15 border-secondary-2/40 hover:bg-secondary/30 relative flex items-start gap-3 overflow-hidden rounded-2xl border p-4 transition-colors"
								>
									<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
										<MoneyTime
											size={18}
											variant="Bulk"
											className="text-green-600"
										/>
									</div>
									<div className="flex min-w-0 flex-1 flex-col gap-1">
										<div className="flex items-start justify-between gap-2">
											<div className="flex flex-col leading-tight">
												<span className="text-secondary-foreground text-sm font-bold">
													{format(
														new Date(payment.paymentDate),
														"MMM dd, yyyy",
													)}
												</span>
												<span className="text-muted-foreground/70 text-[10px] font-medium tracking-wider uppercase">
													{format(new Date(payment.paymentDate), "EEEE")} &middot; #
													{count - idx}
												</span>
											</div>
											<span className="font-heading text-lg font-bold text-green-600 tabular-nums">
												{formatMoney(parseFloat(payment.amount))}
												<span className="ml-1 text-[10px] font-semibold opacity-60">
													MAD
												</span>
											</span>
										</div>
										{payment.notes ? (
											<p className="text-muted-foreground border-secondary-2/40 mt-1 border-t border-dashed pt-2 text-xs italic">
												{payment.notes}
											</p>
										) : null}
									</div>
								</div>
							))}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
