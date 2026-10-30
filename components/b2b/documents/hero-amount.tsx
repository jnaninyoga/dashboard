import { documentAmounts, isOverdue } from "@/lib/domain/billing/payments";
import { type DocumentWithRelations } from "@/lib/types/b2b";
import { formatAmount, formatMoney } from "@/lib/utils/currency";
import { formatDay, studioDateString } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";

const day = (date: string) => formatDay(date, { day: "numeric", month: "long" });

/**
 * The document's money in the header, as it stands: a quotation's amount,
 * an invoice's total while it's a draft, then what's left to collect (red
 * once overdue), or paid in full.
 */
export function HeroAmount({ doc }: { doc: DocumentWithRelations }) {
	const { total, paid, due } = documentAmounts(doc);
	const today = studioDateString();
	const lastPayment = [...(doc.payments ?? [])].sort(
		(a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
	)[0];

	const view =
		doc.type === "quote"
			? { label: "Quoted amount", amount: total, tone: "text-primary", note: null }
			: doc.status === "draft"
				? { label: "Invoice total", amount: total, tone: "text-primary", note: "Not issued yet" }
				: due <= 0 && paid > 0
					? {
							label: "Paid in full",
							amount: total,
							tone: "text-success",
							note: lastPayment ? `on ${day(studioDateString(new Date(lastPayment.paymentDate)))}` : null,
						}
					: isOverdue(doc, today)
						? { label: "Overdue", amount: due, tone: "text-destructive", note: `${paid > 0 ? `of ${formatMoney(total)} · ` : ""}was due ${day(doc.dueDate!)}` }
						: paid > 0
							? { label: "Left to collect", amount: due, tone: "text-primary", note: `${formatMoney(paid)} paid of ${formatMoney(total)}` }
							: { label: "To collect", amount: due, tone: "text-primary", note: doc.dueDate ? `due ${day(doc.dueDate)}` : null };

	return (
		<div className="relative z-10 flex flex-col justify-end md:text-right">
			<span className={cn("text-[10px] font-black tracking-widest uppercase opacity-60", view.tone)}>{view.label}</span>
			<div className={cn("font-heading text-4xl font-black tabular-nums", view.tone, view.tone === "text-primary" && "zen-teal-glow")}>
				{formatAmount(view.amount)}
				<span className="ml-2 text-base font-bold opacity-60">MAD</span>
			</div>
			{view.note ? <span className="text-muted-foreground text-sm">{view.note}</span> : null}
		</div>
	);
}
