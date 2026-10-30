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
import { reversePaymentAction } from "@/lib/actions/b2b/documents";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { studioDateString } from "@/lib/utils/time";
import { type ReversalReason } from "@/lib/validators/document";

import { ArrowRotateLeft } from "iconsax-reactjs";

/**
 * Undoes a payment that didn't really happen (the cheque bounced, the
 * transfer came back, or it was recorded by mistake). The payment stays on
 * record, marked undone; the invoice owes it again.
 */
export function ReversePaymentButton({ paymentId, summary, isCheque }: { paymentId: string; summary: string; isCheque: boolean }) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [reason, setReason] = useState<ReversalReason>("failed");
	const [reversedOn, setReversedOn] = useState(studioDateString());
	const [note, setNote] = useState("");
	const [isPending, startTransition] = useTransition();

	const reasons: { value: ReversalReason; label: string; hint: string }[] = [
		{
			value: "failed",
			label: isCheque ? "The cheque bounced" : "It didn't go through",
			hint: isCheque ? "The bank returned it." : "The money never arrived, or came back.",
		},
		{ value: "mistake", label: "Recorded by mistake", hint: "Wrong amount, invoice or day: record it again after." },
	];

	const submit = (event: React.FormEvent) => {
		event.preventDefault();
		startTransition(async () => {
			const res = await reversePaymentAction(paymentId, { reason, reversedOn, note: note || undefined });
			if (res.success) {
				notify.success("Payment undone", "It's owed again.");
				setOpen(false);
				router.refresh();
			} else {
				notifyActionError(res, "Couldn't undo the payment");
			}
		});
	};

	return (
		<>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				aria-label={`Undo ${summary}`}
				title="Undo this payment"
				onClick={() => setOpen(true)}
				className="text-muted-foreground hover:text-destructive size-8 rounded-lg"
			>
				<ArrowRotateLeft size={16} />
			</Button>
			<Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
				<DialogContent className="rounded-3xl sm:max-w-[440px]">
					<DialogHeader>
						<DialogTitle>Undo this payment?</DialogTitle>
						<DialogDescription>
							{summary}. It stays on record, crossed out, and is owed again (on every invoice it paid).
						</DialogDescription>
					</DialogHeader>
					<form id={`undo-${paymentId}`} onSubmit={submit} className="grid gap-4">
						<fieldset className="grid gap-2">
							<legend className="mb-2 text-sm font-semibold">What happened</legend>
							{reasons.map((option) => (
								<label
									key={option.value}
									className="has-[:checked]:border-destructive/40 has-[:checked]:bg-destructive/5 has-[:focus-visible]:ring-ring flex cursor-pointer items-start gap-3 rounded-xl border p-3 has-[:focus-visible]:ring-2"
								>
									<input
										type="radio"
										name="reason"
										value={option.value}
										checked={reason === option.value}
										onChange={() => setReason(option.value)}
										className="accent-destructive mt-1"
									/>
									<span>
										<span className="block font-medium">{option.label}</span>
										<span className="text-muted-foreground block text-sm">{option.hint}</span>
									</span>
								</label>
							))}
						</fieldset>
						<div className="grid gap-4 sm:grid-cols-2">
							<label className="grid gap-1.5 text-sm font-semibold">
								On
								<Input type="date" value={reversedOn} max={studioDateString()} onChange={(e) => setReversedOn(e.target.value)} className="h-11 rounded-xl" required />
							</label>
							<label className="grid gap-1.5 text-sm font-semibold">
								<span>
									Note <span className="text-muted-foreground font-normal">(optional)</span>
								</span>
								<Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className="h-11 rounded-xl" />
							</label>
						</div>
					</form>
					<DialogFooter>
						<Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="rounded-xl">
							Keep it
						</Button>
						<Button type="submit" form={`undo-${paymentId}`} disabled={isPending} variant="destructive" className="gap-2 rounded-xl font-semibold">
							<ArrowRotateLeft size={16} />
							{isPending ? "Undoing…" : "Undo payment"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
