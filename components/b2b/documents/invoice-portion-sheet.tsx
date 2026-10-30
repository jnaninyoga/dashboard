"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { FormSheet } from "@/components/form-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCreditNoteAction, createInvoiceFromQuoteAction, type InvoicePortion } from "@/lib/actions/b2b/documents";
import { documentName } from "@/lib/domain/billing/document-name";
import {
	linesSubtotal,
	portionByAmount,
	portionByQuantities,
	type QuoteBalance,
} from "@/lib/domain/billing/quote-billing";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { formatMoney, normalizeDecimalInput, parseAmountInput } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/ui";

import { ReceiptAdd, Refresh } from "iconsax-reactjs";

type Mode = InvoicePortion["kind"];

// The same sheet makes an invoice from a quotation, or a credit note (an
// avoir) from an invoice: only the words and the action change.
const WORDS = {
	invoice: {
		title: "New invoice",
		verb: "invoice",
		create: "Create draft invoice",
		created: ["Draft invoice created", "Check it, then mark it as sent."],
		failed: "Couldn't create the invoice",
		hints: { remaining: "What's left of every line.", quantities: "This month's sessions, say.", amount: "A share of what's left." },
		action: createInvoiceFromQuoteAction,
	},
	credit: {
		title: "New credit note",
		verb: "credit",
		create: "Create draft credit note",
		created: ["Draft credit note created", "Check it, then issue it."],
		failed: "Couldn't create the credit note",
		hints: {
			remaining: "Takes back the whole invoice.",
			quantities: "The sessions that didn't happen, say.",
			amount: "A share of the invoice, spread over its lines.",
		},
		action: createCreditNoteAction,
	},
} as const;

const MODES: { value: Mode; label: string }[] = [
	{ value: "remaining", label: "Everything left" },
	{ value: "quantities", label: "Some of it" },
	{ value: "amount", label: "An amount" },
];

const quantity = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

/**
 * Invoices part of a quotation, the way her hotels are billed: everything
 * left at once, the quantities delivered so far, or an amount (each line
 * gives the same share of what's left of it). It makes a draft invoice she
 * checks, then issues.
 */
export function InvoicePortionSheet({
	quote,
	balance,
	open,
	onOpenChange,
	mode: sheetMode = "invoice",
}: {
	/** What it's cut from: a quotation (for an invoice) or an invoice (for a credit note). */
	quote: { id: string; type: string; documentNumber: string | null; taxRate: string };
	/** An invoice from a quotation, or a credit note from an invoice. */
	mode?: keyof typeof WORDS;
	balance: QuoteBalance;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const router = useRouter();
	const formId = useId();
	const [isPending, startTransition] = useTransition();
	const [mode, setMode] = useState<Mode>("remaining");
	const openLines = balance.lines.filter((line) => line.remaining > 0);
	const [quantities, setQuantities] = useState<Record<string, string>>(() =>
		Object.fromEntries(openLines.map((line) => [line.lineId, String(line.remaining)])),
	);
	const [amount, setAmount] = useState("");
	const taxRate = Number(quote.taxRate) || 0;
	const words = WORDS[sheetMode];

	const tooMany = openLines.filter((line) => Number(quantities[line.lineId] || 0) > line.remaining);
	const lines = useMemo(() => {
		if (mode === "amount") return portionByAmount(balance, parseAmountInput(amount));
		if (mode === "quantities") return portionByQuantities(balance, quantities);
		return portionByQuantities(balance, Object.fromEntries(balance.lines.map((line) => [line.lineId, line.remaining])));
	}, [mode, balance, quantities, amount]);
	const subtotal = linesSubtotal(lines);
	const total = Math.round(subtotal * (1 + taxRate / 100) * 100) / 100;
	const amountTooHigh = mode === "amount" && parseAmountInput(amount) > balance.remaining;
	const ready = lines.length > 0 && !tooMany.length && !amountTooHigh;

	const submit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!ready) return;
		const portion: InvoicePortion =
			mode === "quantities" ? { kind: "quantities", quantities } : mode === "amount" ? { kind: "amount", amount } : { kind: "remaining" };
		startTransition(async () => {
			const res = await words.action(quote.id, portion);
			if (res.success && res.id) {
				notify.success(words.created[0], words.created[1]);
				onOpenChange(false);
				router.push(`/b2b/documents/${res.id}`);
			} else {
				notifyActionError(res, words.failed);
			}
		});
	};

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			busy={isPending}
			dirty={false}
			icon={<ReceiptAdd size={28} variant="Bulk" />}
			title={words.title}
			description={`${documentName(quote)}: ${formatMoney(balance.remaining)} left to ${words.verb}${taxRate ? " before tax" : ""}, of ${formatMoney(balance.quoted)}.`}
			footer={
				<Button
					type="submit"
					form={formId}
					disabled={isPending || !ready}
					className="h-11 rounded-xl font-bold shadow-sm transition-all active:scale-95"
				>
					{isPending ? <Refresh size={16} className="mr-2 animate-spin" /> : null}
					{ready ? `${words.create} · ${formatMoney(total)}` : words.create}
				</Button>
			}
		>
			<form id={formId} onSubmit={submit} className="grid gap-6 py-2">
				<fieldset className="grid gap-2">
					<legend className="mb-2 text-sm font-semibold">What to invoice</legend>
					<div role="radiogroup" className="bg-secondary/40 grid grid-cols-3 gap-1 rounded-2xl p-1">
						{MODES.map((option) => (
							<label
								key={option.value}
								className="text-muted-foreground hover:text-foreground has-[:checked]:bg-card has-[:checked]:text-foreground has-[:focus-visible]:ring-ring flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-xl px-2 py-1.5 text-center text-sm font-semibold transition-colors has-[:checked]:shadow-sm has-[:focus-visible]:ring-2"
							>
								<input
									type="radio"
									name="mode"
									value={option.value}
									checked={mode === option.value}
									onChange={() => setMode(option.value)}
									className="sr-only"
								/>
								{option.label}
							</label>
						))}
					</div>
					<p className="text-muted-foreground text-sm">{words.hints[mode]}</p>
				</fieldset>

				{mode === "quantities" ? (
					<ul className="divide-border grid divide-y rounded-2xl border">
						{openLines.map((line) => {
							const over = Number(quantities[line.lineId] || 0) > line.remaining;
							return (
								<li key={line.lineId} className="flex items-center gap-3 px-4 py-3">
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium">{line.description}</p>
										<p className={cn("text-sm", over ? "text-destructive" : "text-muted-foreground")}>
											{over ? `Only ${quantity(line.remaining)} left` : `${quantity(line.remaining)} left of ${quantity(line.ordered)}`} ·{" "}
											{formatMoney(line.unitPrice)} each
										</p>
									</div>
									<Input
										inputMode="decimal"
										aria-label={`Quantity of ${line.description} to ${words.verb}`}
										aria-invalid={over}
										value={quantities[line.lineId] ?? ""}
										onFocus={(event) => event.currentTarget.select()}
										onChange={(event) =>
											setQuantities((current) => ({ ...current, [line.lineId]: normalizeDecimalInput(event.target.value) }))
										}
										className="h-11 w-20 text-center font-mono font-bold"
									/>
								</li>
							);
						})}
					</ul>
				) : null}

				{mode === "amount" ? (
					<div className="grid gap-3">
						<label htmlFor={`${formId}-amount`} className="text-sm font-semibold">
							Amount{taxRate ? " before tax" : ""}
						</label>
						<div className="relative">
							<Input
								id={`${formId}-amount`}
								inputMode="decimal"
								autoFocus
								placeholder="10000"
								value={amount}
								aria-invalid={amountTooHigh}
								onChange={(event) => setAmount(normalizeDecimalInput(event.target.value))}
								className="h-12 pr-14 font-mono text-lg font-bold"
							/>
							<span className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 text-sm">MAD</span>
						</div>
						{amountTooHigh ? (
							<p role="alert" className="text-destructive text-sm">
								Only {formatMoney(balance.remaining)} is left to {words.verb}.
							</p>
						) : null}
						<div className="flex flex-wrap gap-2">
							{[
								{ label: "A quarter", share: 0.25 },
								{ label: "Half", share: 0.5 },
								{ label: "All that's left", share: 1 },
							].map((chip) => (
								<Button
									key={chip.label}
									type="button"
									variant="outline"
									size="sm"
									className="h-9 rounded-full"
									onClick={() => setAmount(String(Math.round(balance.remaining * chip.share * 100) / 100))}
								>
									{chip.label}
								</Button>
							))}
						</div>
					</div>
				) : null}

				{/* What the draft will hold. */}
				<section aria-label={sheetMode === "credit" ? "This credit note" : "This invoice"} className="bg-secondary/30 grid gap-2 rounded-2xl p-4">
					{lines.length ? (
						<ul className="grid gap-1.5 text-sm">
							{lines.map((line) => (
								<li key={line.sourceLineId} className="flex items-baseline gap-2">
									<span className="min-w-0 flex-1 truncate">{line.description}</span>
									<span className="text-muted-foreground font-mono tabular-nums">
										{quantity(Number(line.quantity))} × {formatMoney(Number(line.unitPrice))}
									</span>
								</li>
							))}
						</ul>
					) : (
						<p className="text-muted-foreground text-sm">
							{mode === "amount" ? "Type an amount to see the lines." : "Choose at least one quantity."}
						</p>
					)}
					<div className="border-secondary-2/40 mt-1 flex items-baseline justify-between border-t pt-2">
						<span className="text-sm font-semibold">{taxRate ? `Total with ${quantity(taxRate)}% tax` : "Total"}</span>
						<span className="font-heading text-primary text-xl font-bold tabular-nums">{formatMoney(total)}</span>
					</div>
				</section>
			</form>
		</FormSheet>
	);
}
