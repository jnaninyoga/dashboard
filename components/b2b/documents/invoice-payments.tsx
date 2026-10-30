import { type LedgerEntry, type LedgerInvoice, paymentLedger } from "@/lib/domain/billing/payment-ledger";
import { documentAmounts } from "@/lib/domain/billing/payments";
import { formatMoney } from "@/lib/utils/currency";
import { formatDay, studioDateString } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";
import { type PaymentMethod } from "@/lib/validators/document";

import { Clock, Danger, MoneyRecive, ReceiptText, TickCircle } from "iconsax-reactjs";

import { DocumentSection } from "./document-section";
import { PAYMENT_METHOD } from "./payment-methods";

const day = (date: string | Date) =>
	formatDay(typeof date === "string" ? date : studioDateString(date), { day: "numeric", month: "short", year: "numeric" });

const TONE = {
	primary: "bg-primary/10 text-primary",
	success: "bg-success/12 text-success",
	settled: "bg-success text-success-foreground",
	warning: "bg-warning/12 text-warning",
	destructive: "bg-destructive/10 text-destructive",
};

function describe(entry: LedgerEntry) {
	switch (entry.kind) {
		case "issued":
			return {
				icon: ReceiptText,
				tone: TONE.primary,
				title: "Issued",
				detail: `${day(entry.date)}${entry.dueDate ? ` · due ${day(entry.dueDate)}` : ""}`,
				amount: formatMoney(entry.amount),
				amountTone: "text-foreground",
			};
		case "payment": {
			const method = entry.method ? PAYMENT_METHOD[entry.method as PaymentMethod] : null;
			return {
				icon: method?.icon ?? MoneyRecive,
				tone: TONE.success,
				title: [method?.label ?? "Payment", entry.reference].filter(Boolean).join(" · "),
				detail: `${day(entry.date)} · ${entry.left > 0 ? `${formatMoney(entry.left)} left` : "nothing left"}`,
				amount: `− ${formatMoney(entry.amount)}`,
				amountTone: "text-success",
			};
		}
		case "settled":
			return {
				icon: TickCircle,
				tone: TONE.settled,
				title: "Paid in full",
				detail: entry.date ? day(entry.date) : "",
				amount: null,
				amountTone: "",
			};
		case "open":
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
 * An issued invoice's payments as its story, oldest first: issued, each
 * payment with what it left, then paid in full, or what's still owed (red
 * once overdue).
 */
export function InvoicePayments({
	invoice,
	action,
}: {
	invoice: LedgerInvoice;
	/** Offered where the story ends while money is owed ("Record payment"). */
	action?: React.ReactNode;
}) {
	const entries = paymentLedger(invoice, studioDateString());
	const { total, paid } = documentAmounts(invoice);

	return (
		<DocumentSection
			id="payments"
			title="Payments"
			aside={
				<p className="text-muted-foreground text-sm tabular-nums">
					{paid > 0 ? `${formatMoney(paid)} of ${formatMoney(total)} paid` : "No payment yet"}
				</p>
			}
			className="animate-slide-up delay-150"
		>
			<ol className="bg-card rounded-2xl border p-2 shadow-sm sm:p-3">
				{entries.map((entry, index) => {
					const { icon: EntryIcon, tone, title, detail, amount, amountTone } = describe(entry);
					const last = index === entries.length - 1;
					return (
						<li
							key={entry.kind === "payment" ? entry.id : entry.kind}
							className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 rounded-xl px-2 py-2.5 sm:px-3"
						>
							{/* The thread from one step to the next. */}
							{last ? null : (
								<span aria-hidden className="bg-border absolute top-[calc(50%+18px)] left-[25px] h-[calc(100%-36px)] w-0.5 rounded-full sm:left-[29px]" />
							)}
							<span className={cn("relative flex size-9 items-center justify-center rounded-full", tone)}>
								<EntryIcon size={18} variant={entry.kind === "settled" ? "Bold" : "Bulk"} />
							</span>
							<div className="min-w-0">
								<p className="truncate font-semibold">{title}</p>
								<p className="text-muted-foreground text-sm">{detail}</p>
							</div>
							{amount ? (
								<span className={cn("font-medium tabular-nums", amountTone)}>{amount}</span>
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
