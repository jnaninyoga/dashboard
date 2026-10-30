import { Separator } from "@/components/ui/separator";
import { DocumentWithRelations } from "@/lib/types/b2b";
import { formatAmount } from "@/lib/utils/currency";

/**
 * An issued document's totals: before tax, the tax, and the total, labelled
 * like the rest of the page. Payments have their own section.
 */
export function DocumentTotals({ document }: { document: DocumentWithRelations }) {
	const subtotal = parseFloat(document.subtotal);
	const taxRate = parseFloat(document.taxRate);
	const total = parseFloat(document.totalAmount);

	return (
		<div className="bg-card flex w-full flex-col gap-2.5 rounded-2xl border p-4 shadow-sm">
			<div className="flex items-center justify-between gap-4">
				<span className="text-muted-foreground text-sm">Subtotal</span>
				<span className="font-heading text-foreground text-lg font-bold tabular-nums">
					{formatAmount(subtotal)}
					<span className="text-muted-foreground ml-1 text-xs font-normal">MAD</span>
				</span>
			</div>
			<div className="flex items-center justify-between gap-4">
				<span className="text-muted-foreground text-sm">Tax {taxRate}%</span>
				<span className="font-heading text-foreground text-lg font-bold tabular-nums">
					{formatAmount(total - subtotal)}
					<span className="text-muted-foreground ml-1 text-xs font-normal">MAD</span>
				</span>
			</div>
			<Separator />
			<div className="flex items-center justify-between gap-4">
				<span className="text-foreground font-semibold">Total</span>
				<span className="font-heading text-primary zen-teal-glow text-3xl font-black tabular-nums">
					{formatAmount(total)}
					<span className="text-primary ml-1.5 text-sm font-semibold">MAD</span>
				</span>
			</div>
		</div>
	);
}
