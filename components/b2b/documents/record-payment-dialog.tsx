"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { recordDocumentPaymentAction } from "@/lib/actions/b2b/documents";
import { type DocumentWithRelations } from "@/lib/types/b2b";
import {
	type RecordPaymentFormValues,
	recordPaymentSchema,
} from "@/lib/validators/document";

import { MoneySend, TickCircle, Wallet3 } from "iconsax-reactjs";
import { toast } from "sonner";

export type PaymentQueueEntry = {
	id: string;
	documentNumber: string;
	totalAmount: number;
	amountPaid: number;
};

const formatMAD = (n: number) =>
	n.toLocaleString("fr-FR", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

// Mirrors the server-side allocator so the preview always matches the result.
function previewAllocation(queue: PaymentQueueEntry[], payment: number) {
	let remaining = Math.max(0, payment);
	return queue.map((q) => {
		const due = Math.max(0, q.totalAmount - q.amountPaid);
		const applied = Math.min(remaining, due);
		remaining = Math.max(0, remaining - applied);
		const becomesPaid = q.amountPaid + applied >= q.totalAmount - 0.01;
		return { ...q, due, applied, becomesPaid };
	});
}

export function RecordPaymentDialog({
	doc,
	queue,
	open,
	onOpenChange,
}: {
	doc: DocumentWithRelations;
	queue: PaymentQueueEntry[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	// Latches through the post-submit refresh so a fast double-click cannot
	// re-fire while the page is repainting.
	const [isSubmitting, setIsSubmitting] = useState(false);
	// One UUID per dialog open; the server uses it to dedupe retries via the
	// b2b_payments.request_id UNIQUE index.
	const requestIdRef = useRef<string | null>(null);
	useEffect(() => {
		if (open) {
			requestIdRef.current =
				typeof crypto !== "undefined" && crypto.randomUUID
					? crypto.randomUUID()
					: `${Date.now()}-${Math.random().toString(36).slice(2)}`;
		}
	}, [open]);

	const totalOutstanding = useMemo(
		() =>
			queue.reduce(
				(acc, q) => acc + Math.max(0, q.totalAmount - q.amountPaid),
				0,
			),
		[queue],
	);

	const form = useForm<RecordPaymentFormValues>({
		resolver: zodResolver(recordPaymentSchema),
		defaultValues: { amountPaid: totalOutstanding.toFixed(2) },
	});

	const watchedAmount = form.watch("amountPaid");
	const paidAmount = Number(watchedAmount || 0);

	const allocation = useMemo(
		() => previewAllocation(queue, paidAmount),
		[queue, paidAmount],
	);

	const isMultiInvoice = queue.length > 1;
	const isOverpayment = paidAmount > totalOutstanding + 0.01;
	const isPartial = paidAmount > 0 && paidAmount < totalOutstanding - 0.01;

	const onSubmit = (values: RecordPaymentFormValues) => {
		setIsSubmitting(true);
		startTransition(async () => {
			const res = await recordDocumentPaymentAction(
				doc.id,
				values.amountPaid,
				doc.partnerId,
				requestIdRef.current ?? undefined,
			);

			if (res.success) {
				toast.success(isPartial ? "Partial payment recorded" : "Payment recorded");
				onOpenChange(false);
				router.refresh();
			} else {
				toast.error(res.error || "Failed to record payment");
				setIsSubmitting(false);
			}
		});
	};

	const submitDisabled =
		isPending || isSubmitting || paidAmount <= 0 || isOverpayment;

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) setIsSubmitting(false);
				onOpenChange(next);
			}}
		>
			<DialogContent className="zen-shadow-lg overflow-hidden rounded-3xl border-none p-0 sm:max-w-[460px]">
				<DialogHeader className="bg-card border-b p-8 pb-6">
					<div className="flex items-center gap-4">
						<div className="flex size-12 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-green-600">
							<Wallet3 size={24} variant="Bulk" />
						</div>
						<div>
							<DialogTitle className="text-xl font-bold tracking-tight">
								Record Payment
							</DialogTitle>
							<DialogDescription>
								{isMultiInvoice
									? `Clears oldest invoices first across ${queue.length} open invoices`
									: `Payment for ${doc.documentNumber}`}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="bg-card">
						<div className="space-y-6 p-8">
							<FormField
								control={form.control}
								name="amountPaid"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
											Amount received
										</FormLabel>
										<FormControl>
											<div className="relative">
												<Input
													{...field}
													inputMode="decimal"
													className="h-12 rounded-xl pr-16 text-right font-mono text-lg font-black"
													placeholder="0.00"
												/>
												<div className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 text-xs font-bold tracking-widest">
													MAD
												</div>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Allocation preview — always shown so the operator can see
							    exactly which invoices the payment will clear before
							    confirming. Mirrors the server's FIFO allocator. */}
							<div className="bg-muted/30 space-y-2 rounded-2xl p-4">
								<div className="text-muted-foreground mb-2 text-[9px] font-bold tracking-widest uppercase">
									{isMultiInvoice ? "FIFO allocation" : "This invoice"}
								</div>
								{allocation.map((a) => {
									const stillDue = Math.max(0, a.due - a.applied);
									return (
										<div
											key={a.id}
											className="flex items-center justify-between text-sm"
										>
											<div className="flex flex-col">
												<span className="font-mono text-[11px] font-bold tracking-wider">
													{a.documentNumber}
												</span>
												<span className="text-muted-foreground text-[10px]">
													{formatMAD(a.due)} MAD due
													{a.applied > 0
														? ` · ${a.becomesPaid ? "fully paid" : `${formatMAD(stillDue)} remaining`}`
														: null}
												</span>
											</div>
											<span
												className={`font-mono text-sm font-bold ${
													a.applied > 0
														? a.becomesPaid
															? "text-green-600"
															: "text-amber-600"
														: "text-muted-foreground/40"
												}`}
											>
												{a.applied > 0 ? `+${formatMAD(a.applied)}` : "—"}
											</span>
										</div>
									);
								})}
								<div className="mt-2 flex items-center justify-between border-t pt-2">
									<span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
										Total outstanding
									</span>
									<span className="font-mono text-sm font-bold">
										{formatMAD(totalOutstanding)} MAD
									</span>
								</div>
							</div>

							{isOverpayment ? (
								<div className="text-destructive border-destructive/20 bg-destructive/5 flex items-center gap-2 rounded-xl border p-3 text-[11px] font-medium">
									Payment exceeds outstanding balance by{" "}
									{formatMAD(paidAmount - totalOutstanding)} MAD.
								</div>
							) : null}
						</div>

						<DialogFooter className="bg-muted/20 border-t p-6">
							<Button
								type="submit"
								disabled={submitDisabled}
								className={`h-11 w-full gap-2 rounded-xl font-black ${
									isPartial
										? "bg-amber-600 hover:bg-amber-700"
										: "bg-green-600 hover:bg-green-700"
								}`}
							>
								{isPending || isSubmitting ? (
									"Recording…"
								) : (
									<>
										<TickCircle size={18} variant="Bold" />
										{isPartial ? "Confirm partial payment" : "Confirm payment"}
									</>
								)}
								{!isPending && !isSubmitting && paidAmount > 0 ? (
									<MoneySend size={16} variant="Bold" />
								) : null}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
