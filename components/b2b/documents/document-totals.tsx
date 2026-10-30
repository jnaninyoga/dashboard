import { Separator } from "@/components/ui/separator";
import { DocumentWithRelations } from "@/lib/types/b2b";
import { formatAmount } from "@/lib/utils/currency";

/** An issued document's totals: before tax, the tax, and the total. Payments have their own section. */
export function DocumentTotals({ document, isQuote }: { document: DocumentWithRelations; isQuote: boolean }) {
	const subtotal = parseFloat(document.subtotal);
	const taxRate = parseFloat(document.taxRate);
	const total = parseFloat(document.totalAmount);

	return (
		<div className="bg-card border-foreground/10 w-full rounded-3xl border p-8 shadow-sm">
			<div className="space-y-4">
				<h3 className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-50">
					{isQuote ? "Quote Totals" : "Invoice Totals"}
				</h3>

				<div className="space-y-3">
					<div className="flex w-full items-center justify-between">
						<span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">Subtotal</span>
						<span className="font-heading text-foreground text-lg font-bold tabular-nums">
							{formatAmount(subtotal)}
							<span className="text-muted-foreground/70 ml-1 text-xs font-normal">MAD</span>
						</span>
					</div>
					<div className="flex w-full items-center justify-between">
						<span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">Tax ({taxRate}%)</span>
						<span className="font-heading text-foreground text-lg font-bold tabular-nums">
							{formatAmount(total - subtotal)}
							<span className="text-muted-foreground/70 ml-1 text-xs font-normal">MAD</span>
						</span>
					</div>

					<Separator />
					<div className="flex w-full items-center justify-between">
						<span className="font-heading text-primary text-xs font-bold tracking-[0.2em] uppercase">
							{isQuote ? "Quote Total" : "Invoice Total"}
						</span>
						<span className="font-heading text-primary text-3xl font-bold tracking-tight tabular-nums">
							{formatAmount(total)}
							<span className="ml-1.5 text-sm font-semibold opacity-60">MAD</span>
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
