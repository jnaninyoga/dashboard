"use client";

import { useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { recordRefundAction } from "@/lib/actions/b2b/documents";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { formatMoney, normalizeDecimalInput, parseAmountInput } from "@/lib/utils/currency";
import { studioDateString } from "@/lib/utils/time";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/validators/document";

import { MoneySend } from "iconsax-reactjs";

import { PAYMENT_METHOD } from "./payment-methods";

const REFERENCE: Record<PaymentMethod, string> = {
	transfer: "Transfer reference",
	cheque: "Cheque number",
	cash: "Receipt number",
	card: "Card receipt number",
};

/**
 * Money given back to the partner on an issued credit note: what its
 * invoice couldn't absorb because it was already paid. On the day it left,
 * with how, and a reference to find it on the bank statement.
 */
export function RecordRefundButton({
	creditNoteId,
	creditNoteName,
	toRefund,
	className,
}: {
	creditNoteId: string;
	creditNoteName: string;
	toRefund: number;
	className?: string;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [amount, setAmount] = useState(toRefund.toFixed(2));
	const [refundedOn, setRefundedOn] = useState(studioDateString());
	const [method, setMethod] = useState<PaymentMethod>("transfer");
	const [reference, setReference] = useState("");
	const [requestId, setRequestId] = useState("");
	const [isPending, startTransition] = useTransition();

	if (!(toRefund > 0)) return null;
	const value = parseAmountInput(amount);
	const tooMuch = value > toRefund + 0.001;

	const start = () => {
		setAmount(toRefund.toFixed(2));
		setRefundedOn(studioDateString());
		setReference("");
		// Each opening is one refund: a retry of the same submit isn't recorded twice.
		setRequestId(crypto.randomUUID());
		setOpen(true);
	};

	const submit = (event: React.FormEvent) => {
		event.preventDefault();
		startTransition(async () => {
			const res = await recordRefundAction(
				creditNoteId,
				{ amountPaid: amount, paymentDate: refundedOn, method, reference: reference || undefined },
				requestId,
			);
			if (res.success) {
				notify.success("Refund recorded");
				setOpen(false);
				router.refresh();
			} else {
				notifyActionError(res, "Couldn't record the refund");
			}
		});
	};

	return (
		<>
			<Button onClick={start} className={className ?? "gap-2 rounded-xl font-bold"}>
				<MoneySend size={18} variant="Bold" />
				Record refund
			</Button>
			<Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
				<DialogContent className="rounded-3xl sm:max-w-[440px]">
					<DialogHeader>
						<DialogTitle>Record refund</DialogTitle>
						<DialogDescription>
							Money given back on {creditNoteName}: {formatMoney(toRefund)} is left to refund.
						</DialogDescription>
					</DialogHeader>
					<form id={`refund-${creditNoteId}`} onSubmit={submit} className="grid gap-4">
						<label className="grid gap-1.5 text-sm font-semibold">
							Amount given back
							<span className="relative">
								<Input
									inputMode="decimal"
									value={amount}
									aria-invalid={tooMuch}
									onChange={(e) => setAmount(normalizeDecimalInput(e.target.value))}
									className="h-12 rounded-xl pr-14 text-right font-mono text-lg font-bold"
								/>
								<span className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 text-sm">MAD</span>
							</span>
							{tooMuch ? (
								<span role="alert" className="text-destructive font-normal">
									Only {formatMoney(toRefund)} is left to refund.
								</span>
							) : null}
						</label>
						<div className="grid gap-4 sm:grid-cols-2">
							<label className="grid gap-1.5 text-sm font-semibold">
								Given back on
								<Input type="date" value={refundedOn} max={studioDateString()} onChange={(e) => setRefundedOn(e.target.value)} className="h-11 rounded-xl" required />
							</label>
							<label className="grid gap-1.5 text-sm font-semibold">
								<span>
									{REFERENCE[method]} <span className="text-muted-foreground font-normal">(optional)</span>
								</span>
								<Input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={80} autoComplete="off" className="h-11 rounded-xl" />
							</label>
						</div>
						<fieldset className="grid gap-2">
							<legend className="mb-2 text-sm font-semibold">Given back by</legend>
							<div className="bg-secondary/40 grid grid-cols-4 gap-1 rounded-2xl p-1">
								{PAYMENT_METHODS.map((option) => (
									<label
										key={option}
										className="text-muted-foreground hover:text-foreground has-[:checked]:bg-card has-[:checked]:text-foreground has-[:focus-visible]:ring-ring flex min-h-10 cursor-pointer items-center justify-center rounded-xl px-2 text-sm font-semibold transition-colors has-[:checked]:shadow-sm has-[:focus-visible]:ring-2"
									>
										<input
											type="radio"
											name="method"
											value={option}
											checked={method === option}
											onChange={() => setMethod(option)}
											className="sr-only"
										/>
										{PAYMENT_METHOD[option].label}
									</label>
								))}
							</div>
						</fieldset>
					</form>
					<DialogFooter>
						<Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="rounded-xl">
							Cancel
						</Button>
						<Button type="submit" form={`refund-${creditNoteId}`} disabled={isPending || tooMuch || !(value > 0)} className="gap-2 rounded-xl font-semibold">
							<MoneySend size={16} variant="Bold" />
							{isPending ? "Recording…" : "Record refund"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
