"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

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
import {
	allocatePayment,
	outstandingOf,
	type PaymentTarget,
} from "@/lib/domain/billing/payments";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { type DocumentWithRelations } from "@/lib/types/b2b";
import { parseAmountInput } from "@/lib/utils/currency";
import {
	type RecordPaymentFormValues,
	recordPaymentSchema,
} from "@/lib/validators/document";

import { zodResolver } from "@hookform/resolvers/zod";
import { MoneySend, TickCircle, Wallet3 } from "iconsax-reactjs";

export type PaymentQueueEntry = PaymentTarget;

const formatMAD = (n: number) =>
	n.toLocaleString("fr-FR", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

// crypto.randomUUID only exists in secure contexts; the server column is a
// uuid, so the fallback must still produce a valid v4 UUID.
function newRequestId(): string {
	if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
	const b = crypto.getRandomValues(new Uint8Array(16));
	b[6] = (b[6] & 0x0f) | 0x40;
	b[8] = (b[8] & 0x3f) | 0x80;
	const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
	return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
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
	const totalOutstanding = useMemo(() => outstandingOf(queue), [queue]);
	// The invoice being viewed is paid first, so it is the default amount.
	const thisInvoiceDue = useMemo(
		() => outstandingOf(queue.filter((q) => q.id === doc.id)),
		[queue, doc.id],
	);

	const form = useForm<RecordPaymentFormValues>({
		resolver: zodResolver(recordPaymentSchema),
		defaultValues: { amountPaid: thisInvoiceDue.toFixed(2) },
	});

	// Each open is a fresh payment: new idempotency key (the server dedupes
	// retries via the b2b_payments.request_id UNIQUE index), cleared submit
	// latch, and an amount matching the balance as it is now.
	const requestIdRef = useRef<string | null>(null);
	useEffect(() => {
		if (!open) return;
		requestIdRef.current = newRequestId();
		setIsSubmitting(false);
		form.reset({ amountPaid: thisInvoiceDue.toFixed(2) });
	}, [open, thisInvoiceDue, form]);

	// eslint-disable-next-line react-hooks/incompatible-library
	const watchedAmount = form.watch("amountPaid");
	const parsedAmount = parseAmountInput(watchedAmount);
	const paidAmount = Number.isFinite(parsedAmount) ? parsedAmount : 0;

	const allocation = useMemo(
		() => allocatePayment(queue, paidAmount),
		[queue, paidAmount],
	);

	const isMultiInvoice = queue.length > 1;
	const isOverpayment = paidAmount > totalOutstanding + 0.01;
	// "Partial" is about the invoice being viewed, not the whole chain.
	const isPartial =
		paidAmount > 0 && paidAmount < (thisInvoiceDue || totalOutstanding) - 0.005;

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
				notify.success(isPartial ? "Partial payment recorded" : "Payment recorded");
				onOpenChange(false);
				router.refresh();
			} else {
				notifyActionError(res, "Failed to record payment");
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
									? `Pays ${doc.documentNumber} first, then the other open invoices from this quote`
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
							    confirming. Uses the same allocator as the server. */}
							<div className="bg-muted/30 space-y-2 rounded-2xl p-4">
								<div className="text-muted-foreground mb-2 text-[9px] font-bold tracking-widest uppercase">
									{isMultiInvoice ? "Where the payment goes" : "This invoice"}
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
