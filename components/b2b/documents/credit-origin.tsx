import Link from "next/link";

import { documentName } from "@/lib/domain/billing/document-name";
import { documentAmounts } from "@/lib/domain/billing/payments";
import { type DocumentWithRelations } from "@/lib/types/b2b";
import { formatMoney } from "@/lib/utils/currency";

import { ArrowRight2, ReceiptText } from "iconsax-reactjs";

/**
 * Where a credit note comes from: the invoice it takes back from, and how
 * much. Once issued, how it was settled: taken off what the invoice still
 * owed, and what's left to give back.
 */
export function CreditOrigin({ note, invoice }: { note: DocumentWithRelations; invoice: DocumentWithRelations }) {
	const { total, credited, settled, toRefund } = documentAmounts(note);
	const givenBack = Math.round((settled - credited) * 100) / 100;
	const issued = note.status !== "draft";

	return (
		<Link
			href={`/b2b/documents/${invoice.id}`}
			className="group flex animate-slide-up items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm delay-75 outline-none hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
		>
			<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
				<ReceiptText size={20} variant="Bulk" />
			</span>
			<span className="min-w-0 flex-1">
				<span className="block">
					<span className="text-muted-foreground">Takes back {formatMoney(total)} of </span>
					<span className="font-semibold text-primary group-hover:underline">{documentName(invoice)}</span>
					<span className="text-muted-foreground"> ({formatMoney(Number(invoice.totalAmount))})</span>
				</span>
				<span className="block text-sm text-muted-foreground">
					{issued
						? [
								credited > 0 ? `${formatMoney(credited)} taken off what it owed` : null,
								givenBack > 0 ? `${formatMoney(givenBack)} given back` : null,
								toRefund > 0 ? `${formatMoney(toRefund)} to give back` : null,
							]
								.filter(Boolean)
								.join(" · ") || "Settled"
						: "Once issued, it comes off what the invoice still owes; what was already paid is given back."}
				</span>
			</span>
			<ArrowRight2 size={16} aria-hidden className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
		</Link>
	);
}
