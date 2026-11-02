import { CURRENCY, formatAmount } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/ui";

/**
 * Every price on screen: the amount in the studio's format, then "MAD", set
 * apart and sized from the amount (never below a readable 10px), so a price
 * reads the same in a table, a total or a header. Figures line up in columns.
 */
export function Money({
	amount,
	sign,
	className,
	currencyClassName,
}: {
	amount: number | string;
	/** "−" for money going out or coming off, "+" for money owed again. */
	sign?: "+" | "−";
	className?: string;
	currencyClassName?: string;
}) {
	return (
		<span className={cn("whitespace-nowrap tabular-nums", className)}>
			{sign ? `${sign} ` : null}
			{formatAmount(amount)}
			<span className={cn("ml-[0.3em] text-[max(0.625rem,0.5em)] font-medium opacity-60", currencyClassName)}>{CURRENCY}</span>
		</span>
	);
}
