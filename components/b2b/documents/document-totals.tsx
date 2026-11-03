import { Money } from "@/components/money";
import { Separator } from "@/components/ui/separator";
import { DocumentWithRelations } from "@/lib/types/b2b";

/**
 * An issued document's totals: before tax, the tax, and the total, labelled
 * like the rest of the page. Payments have their own section.
 */
export function DocumentTotals({ document }: { document: DocumentWithRelations }) {
	const subtotal = parseFloat(document.subtotal);
	const taxRate = parseFloat(document.taxRate);
	const total = parseFloat(document.totalAmount);

	return (
		<div className="flex w-full flex-col gap-2.5 rounded-2xl border bg-card p-4 shadow-sm">
			<div className="flex items-center justify-between gap-4">
				<span className="text-sm text-muted-foreground">Subtotal</span>
				<span className="font-heading text-lg font-bold text-foreground tabular-nums">
					<Money amount={subtotal} />
				</span>
			</div>
			<div className="flex items-center justify-between gap-4">
				<span className="text-sm text-muted-foreground">Tax {taxRate}%</span>
				<span className="font-heading text-lg font-bold text-foreground tabular-nums">
					<Money amount={total - subtotal} />
				</span>
			</div>
			<Separator />
			<div className="flex items-center justify-between gap-4">
				<span className="font-semibold text-foreground">Total</span>
				<span className="zen-teal-glow font-heading text-3xl font-black text-primary tabular-nums">
					<Money amount={total} />
				</span>
			</div>
		</div>
	);
}
