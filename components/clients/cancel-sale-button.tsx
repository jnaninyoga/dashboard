"use client";

import { useState, useTransition } from "react";

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
import { cancelCardSaleAction } from "@/lib/actions/clients/wallets";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { type CancelSaleReason } from "@/lib/validators/membership-sale";

import { ArrowRotateLeft } from "iconsax-reactjs";

const REASONS: { value: CancelSaleReason; label: string; hint: string }[] = [
	{ value: "mistake", label: "Sold by mistake", hint: "Wrong client, card or price: sell it again after." },
	{ value: "refunded", label: "Money given back", hint: "The client was paid back for it." },
];

/**
 * Undoes a card sale. The card stays on record, crossed out with why; its
 * credits stop counting. Visits already taken from it stay in history.
 */
export function CancelSaleButton({
	walletId,
	summary,
	creditsLeft,
	visitsTaken,
}: {
	walletId: string;
	/** "Carte 10, sold 2 Nov for 450 MAD". */
	summary: string;
	creditsLeft: number;
	visitsTaken: number;
}) {
	const [open, setOpen] = useState(false);
	const [reason, setReason] = useState<CancelSaleReason>("mistake");
	const [note, setNote] = useState("");
	const [isPending, startTransition] = useTransition();

	const submit = (event: React.FormEvent) => {
		event.preventDefault();
		startTransition(async () => {
			const res = await cancelCardSaleAction(walletId, { reason, note: note || undefined });
			if (res.success) {
				notify.success("Sale undone", "Its credits no longer count.");
				setOpen(false);
			} else {
				notifyActionError(res, "Couldn't undo the sale");
			}
		});
	};

	return (
		<>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				aria-label={`Undo the sale: ${summary}`}
				title="Undo this sale"
				onClick={() => {
					setReason("mistake");
					setNote("");
					setOpen(true);
				}}
				className="text-muted-foreground hover:text-destructive size-9 rounded-lg"
			>
				<ArrowRotateLeft size={18} />
			</Button>
			<Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
				<DialogContent className="rounded-3xl sm:max-w-[440px]">
					<DialogHeader>
						<DialogTitle>Undo this sale?</DialogTitle>
						<DialogDescription>
							{summary}. It stays on record, crossed out
							{creditsLeft ? `, and its ${creditsLeft} ${creditsLeft === 1 ? "credit" : "credits"} left stop counting` : ""}.
							{visitsTaken === 1
								? " The visit already taken from it stays in their history."
								: visitsTaken
									? ` The ${visitsTaken} visits already taken from it stay in their history.`
									: ""}
						</DialogDescription>
					</DialogHeader>
					<form id={`undo-sale-${walletId}`} onSubmit={submit} className="grid gap-4">
						<fieldset className="grid gap-2">
							<legend className="mb-2 text-sm font-semibold">What happened</legend>
							{REASONS.map((option) => (
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
						<label className="grid gap-1.5 text-sm font-semibold">
							<span>
								Note <span className="text-muted-foreground font-normal">(optional)</span>
							</span>
							<Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className="h-11 rounded-xl" />
						</label>
					</form>
					<DialogFooter>
						<Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="rounded-xl">
							Keep it
						</Button>
						<Button
							type="submit"
							form={`undo-sale-${walletId}`}
							disabled={isPending}
							variant="destructive"
							className="gap-2 rounded-xl font-semibold"
						>
							<ArrowRotateLeft size={16} />
							{isPending ? "Undoing…" : "Undo sale"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
