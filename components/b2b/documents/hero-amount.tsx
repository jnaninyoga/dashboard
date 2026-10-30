import { documentAmounts, isOverdue } from "@/lib/domain/billing/payments";
import { type DocumentWithRelations } from "@/lib/types/b2b";
import { formatAmount, formatMoney } from "@/lib/utils/currency";
import { formatDay, studioDateString } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";

const day = (date: string) => formatDay(date, { day: "numeric", month: "long" });

type View = { label: string; amount: number; tone: string; note: string | null };

/**
 * The document's money in the header, as it stands: a quotation's amount,
 * a draft's total, then what's left to collect (red once overdue), paid in
 * full or settled by a credit note; on a credit note, what's left to give
 * back, or settled.
 */
export function HeroAmount({ doc }: { doc: DocumentWithRelations }) {
	const { total, paid, credited, settled, due, toRefund } = documentAmounts(doc);
	const today = studioDateString();
	const lastMove = [...(doc.payments ?? [])].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];
	const on = lastMove ? `on ${day(studioDateString(new Date(lastMove.paymentDate)))}` : null;

	const view: View = (() => {
		if (doc.type === "quote") return { label: "Quoted amount", amount: total, tone: "text-primary", note: null };
		if (doc.status === "draft") {
			return { label: `${doc.type === "credit_note" ? "Credit note" : "Invoice"} total`, amount: total, tone: "text-primary", note: "Not issued yet" };
		}
		if (doc.type === "credit_note") {
			return toRefund > 0
				? { label: "To refund", amount: toRefund, tone: "text-warning", note: `of ${formatMoney(total)} credited` }
				: { label: "Settled", amount: total, tone: "text-success", note: on };
		}
		if (due <= 0 && settled > 0) {
			// Settled: by payments, by a credit note, or both.
			const label = credited > 0 ? (paid > 0 ? "Settled" : "Credited") : "Paid in full";
			return { label, amount: total, tone: "text-success", note: on };
		}
		const progress = [paid > 0 ? `${formatMoney(paid)} paid` : null, credited > 0 ? `${formatMoney(credited)} credited` : null].filter(Boolean).join(", ");
		if (isOverdue(doc, today)) {
			return { label: "Overdue", amount: due, tone: "text-destructive", note: `${progress ? `${progress} · ` : ""}was due ${day(doc.dueDate!)}` };
		}
		if (settled > 0) return { label: "Left to collect", amount: due, tone: "text-primary", note: `${progress} of ${formatMoney(total)}` };
		return { label: "To collect", amount: due, tone: "text-primary", note: doc.dueDate ? `due ${day(doc.dueDate)}` : null };
	})();

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
