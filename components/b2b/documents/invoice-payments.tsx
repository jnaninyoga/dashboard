import Link from "next/link";

import { PAYMENT_METHOD } from "@/components/payment-methods";
import { type LedgerEntry, type LedgerInvoice, paymentLedger } from "@/lib/domain/billing/payment-ledger";
import { documentAmounts } from "@/lib/domain/billing/payments";
import { formatMoney } from "@/lib/utils/currency";
import { formatDay, studioDateString } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";
import { type PaymentMethod } from "@/lib/validators/document";

import {
	ArrowRotateLeft,
	Clock,
	Danger,
	MoneyRecive,
	MoneySend,
	ReceiptMinus,
	ReceiptText,
	TickCircle,
} from "iconsax-reactjs";

import { DocumentSection } from "./document-section";
import { ReversePaymentButton } from "./reverse-payment-button";

const day = (date: string | Date) =>
	formatDay(typeof date === "string" ? date : studioDateString(date), { day: "numeric", month: "short", year: "numeric" });

const TONE = {
	primary: "bg-primary/10 text-primary",
	success: "bg-success/12 text-success",
	settled: "bg-success text-success-foreground",
	warning: "bg-warning/12 text-warning",
	destructive: "bg-destructive/10 text-destructive",
	muted: "bg-muted text-muted-foreground",
};

const methodOf = (method: string | null) => (method ? PAYMENT_METHOD[method as PaymentMethod] : null);

type Step = {
	icon: React.ComponentType<{ size?: number; variant?: "Bold" | "Bulk" }>;
	tone: string;
	title: React.ReactNode;
	detail: string;
	amount: string | null;
	amountTone: string;
};

function describe(entry: LedgerEntry, creditNote: boolean, credited: boolean): Step {
	const left = (amount: number) => (amount > 0 ? `${formatMoney(amount)} left` : "nothing left");
	switch (entry.kind) {
		case "issued":
			return {
				icon: creditNote ? ReceiptMinus : ReceiptText,
				tone: TONE.primary,
				title: "Issued",
				detail: `${day(entry.date)}${entry.dueDate ? ` · due ${day(entry.dueDate)}` : ""}`,
				amount: formatMoney(entry.amount),
				amountTone: "text-foreground",
			};
		case "payment": {
			const method = methodOf(entry.method);
			// An undone payment stays in the story, crossed out.
			return {
				icon: method?.icon ?? MoneyRecive,
				tone: entry.reversedOn ? TONE.muted : TONE.success,
				title: [method?.label ?? "Payment", entry.reference].filter(Boolean).join(" · "),
				detail: entry.reversedOn ? `${day(entry.date)} · undone ${day(entry.reversedOn)}` : `${day(entry.date)} · ${left(entry.left)}`,
				amount: `− ${formatMoney(entry.amount)}`,
				amountTone: entry.reversedOn ? "text-muted-foreground line-through" : "text-success",
			};
		}
		case "reversal":
			return {
				icon: ArrowRotateLeft,
				tone: TONE.destructive,
				title: entry.reason ?? "Payment undone",
				detail: `${day(entry.date)} · ${formatMoney(entry.left)} owed again`,
				amount: `+ ${formatMoney(entry.amount)}`,
				amountTone: "text-destructive",
			};
		case "credit": {
			const label = entry.reason ?? (creditNote ? "Set against its invoice" : "Credit note");
			return {
				icon: ReceiptMinus,
				tone: TONE.primary,
				// The other document is a tap away: the credit note, or its invoice.
				title: entry.counterpartId ? (
					<Link href={`/b2b/documents/${entry.counterpartId}`} className="hover:text-primary hover:underline">
						{label}
					</Link>
				) : (
					label
				),
				detail: `${day(entry.date)} · ${creditNote ? (entry.left > 0 ? `${formatMoney(entry.left)} to refund` : "nothing to refund") : left(entry.left)}`,
				amount: `− ${formatMoney(entry.amount)}`,
				amountTone: "text-primary",
			};
		}
		case "refund": {
			const method = methodOf(entry.method);
			return {
				icon: method?.icon ?? MoneySend,
				tone: TONE.success,
				title: [method ? `Refund by ${method.label.toLowerCase()}` : "Refund", entry.reference].filter(Boolean).join(" · "),
				detail: `${day(entry.date)} · ${entry.left > 0 ? `${formatMoney(entry.left)} still to refund` : "nothing left to refund"}`,
				amount: `− ${formatMoney(entry.amount)}`,
				amountTone: "text-success",
			};
		}
		case "settled":
			return {
				icon: TickCircle,
				tone: TONE.settled,
				// Part of it cancelled by a credit note: settled, not all paid.
				title: creditNote || credited ? "Settled" : "Paid in full",
				detail: entry.date ? day(entry.date) : "",
				amount: null,
				amountTone: "",
			};
		case "open":
			if (creditNote) {
				return {
					icon: MoneySend,
					tone: TONE.warning,
					title: `${formatMoney(entry.left)} to refund`,
					detail: "Already paid on its invoice: give it back to the partner",
					amount: null,
					amountTone: "",
				};
			}
			return {
				icon: entry.overdue ? Danger : Clock,
				tone: entry.overdue ? TONE.destructive : TONE.warning,
				title: entry.overdue ? `${formatMoney(entry.left)} overdue` : `${formatMoney(entry.left)} to collect`,
				detail: entry.dueDate ? `${entry.overdue ? "Was due" : "Due"} ${day(entry.dueDate)}` : "No due date",
				amount: null,
				amountTone: "",
			};
	}
}

/**
 * An issued invoice's money as its story, oldest first: issued, each
 * payment with what it left (one that didn't go through can be undone: it
 * stays, crossed out, and is owed again), credit notes set against it, then
 * paid in full, or what's still owed (red once overdue). A credit note
 * tells its own: set against its invoice, refunds, settled or to refund.
 */
export function InvoicePayments({
	invoice,
	action,
}: {
	invoice: LedgerInvoice;
	/** Offered where the story ends while money is owed ("Record payment", "Record refund"). */
	action?: React.ReactNode;
}) {
	const creditNote = invoice.type === "credit_note";
	const entries = paymentLedger(invoice, studioDateString());
	const { total, paid, credited, toRefund } = documentAmounts(invoice);
	const summary = creditNote
		? toRefund > 0
			? `${formatMoney(toRefund)} to refund`
			: "Settled"
		: paid > 0 || credited > 0
			? `${formatMoney(paid)} of ${formatMoney(total)} paid${credited > 0 ? `, ${formatMoney(credited)} credited` : ""}`
			: "No payment yet";

	return (
		<DocumentSection
			id="payments"
			title={creditNote ? "Settlement" : "Payments"}
			aside={<p className="text-sm text-muted-foreground tabular-nums">{summary}</p>}
			className="animate-slide-up delay-150"
		>
			<ol className="rounded-2xl border bg-card p-2 shadow-sm sm:p-3">
				{entries.map((entry, index) => {
					const { icon: EntryIcon, tone, title, detail, amount, amountTone } = describe(entry, creditNote, credited > 0);
					const last = index === entries.length - 1;
					return (
						<li
							key={"id" in entry ? entry.id : entry.kind}
							className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 rounded-xl px-2 py-2.5 sm:px-3"
						>
							{/* The thread from one step to the next. */}
							{last ? null : (
								<span aria-hidden className="absolute top-[calc(50%+18px)] left-[25px] h-[calc(100%-36px)] w-0.5 rounded-full bg-border sm:left-[29px]" />
							)}
							<span className={cn("relative flex size-9 items-center justify-center rounded-full", tone)}>
								<EntryIcon size={18} variant={entry.kind === "settled" ? "Bold" : "Bulk"} />
							</span>
							<div className="min-w-0">
								<p className="truncate font-semibold">{title}</p>
								<p className="text-sm text-muted-foreground">{detail}</p>
							</div>
							{amount ? (
								<span className="flex items-center gap-1">
									<span className={cn("font-medium tabular-nums", amountTone)}>{amount}</span>
									{entry.kind === "payment" && !entry.reversedOn && !invoice.archivedAt ? (
										<ReversePaymentButton
											paymentId={entry.id}
											isCheque={entry.method === "cheque"}
											summary={`${methodOf(entry.method)?.label ?? "Payment"} of ${formatMoney(entry.amount)} on ${day(entry.date)}`}
										/>
									) : null}
								</span>
							) : entry.kind === "open" && action ? (
								// Under the words on a phone, beside them from sm up.
								<div className="max-sm:col-span-2 max-sm:col-start-2 max-sm:mt-2">{action}</div>
							) : (
								<span />
							)}
						</li>
					);
				})}
			</ol>
		</DocumentSection>
	);
}
