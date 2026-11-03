import { type PieceState, type QuoteTape, type TapePiece } from "@/lib/domain/billing/quote-tape";
import { formatMoney } from "@/lib/utils/currency";
import { formatDay, studioDateString } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";

// One look per state, shared by the tape, its legend and the invoice lists:
// paid is green, waiting amber, overdue red, a draft only outlined; what's
// paid of a piece fills it in green.
const PIECE: Record<PieceState, string> = {
	paid: "bg-success",
	partly: "bg-warning/45",
	waiting: "bg-warning/45",
	overdue: "bg-destructive/60",
	draft: "border border-dashed border-primary/50 bg-primary/5",
};

// What isn't invoiced yet: the rest of the roll, quietly hatched.
const ROLL = "bg-[repeating-linear-gradient(135deg,var(--color-border)_0_2px,transparent_2px_7px)]";

/**
 * A quotation's tape: its invoices laid end to end, in the order they were
 * issued, each as long as its share of the quotation and filled as it's
 * paid; then what's left to invoice. On an invoice's page, that invoice
 * stands out (`currentId`). The pieces lay down one after another, then the
 * payments fill in (still under reduced motion).
 */
export function BillingTape({ tape, currentId, className }: { tape: QuoteTape; currentId?: string; className?: string }) {
	const rest = Math.max(0, 1 - tape.pieces.reduce((sum, piece) => sum + piece.share, 0));
	return (
		<div
			role="img"
			aria-label={`${formatMoney(tape.invoiced)} invoiced of ${formatMoney(tape.quoted)}, ${formatMoney(tape.collected)} collected${tape.left > 0 ? `, ${formatMoney(tape.left)} left to invoice` : ""}.`}
			className={cn("flex h-4 w-full gap-[3px] rounded-full bg-secondary/50 p-[3px]", className)}
		>
			{tape.pieces.map((piece, index) => (
				<div
					key={piece.id}
					style={{ flexGrow: piece.share, flexBasis: 0, animationDelay: `${index * 90}ms` }}
					className={cn(
						"relative h-full min-w-2 origin-left overflow-hidden rounded-full transition-opacity motion-safe:animate-tape-grow",
						PIECE[piece.state],
						currentId && piece.id !== currentId && "opacity-35",
					)}
				>
					{piece.state !== "paid" && piece.filled > 0 ? (
						<div
							style={{ width: `${piece.filled * 100}%`, animationDelay: `${index * 90 + 300}ms` }}
							className="absolute inset-y-0 left-0 origin-left rounded-full bg-success motion-safe:animate-tape-grow"
						/>
					) : null}
				</div>
			))}
			{rest > 0.001 ? <div style={{ flexGrow: rest, flexBasis: 0 }} className={cn("h-full rounded-full", ROLL)} /> : null}
		</div>
	);
}

/** The tape's key, with the money behind each colour (only what there is). */
export function TapeLegend({ tape, className }: { tape: QuoteTape; className?: string }) {
	const items = [
		{ label: "Collected", amount: tape.collected, swatch: "bg-success" },
		{ label: "Waiting", amount: tape.waiting, swatch: "bg-warning/45" },
		{ label: "Overdue", amount: tape.overdue, swatch: "bg-destructive/60" },
		{ label: "In draft", amount: tape.drafted, swatch: "border border-dashed border-primary/60" },
		{ label: "Left to invoice", amount: tape.left, swatch: cn("border", ROLL) },
	].filter((item) => item.amount > 0);
	return (
		<dl className={cn("flex flex-wrap gap-x-5 gap-y-1.5 text-sm", className)}>
			{items.map((item) => (
				<div key={item.label} className="flex items-center gap-2">
					<span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", item.swatch)} />
					<dt className="text-muted-foreground">{item.label}</dt>
					<dd className="font-medium tabular-nums">{formatMoney(item.amount)}</dd>
				</div>
			))}
		</dl>
	);
}

/** A piece on its own, small: the mark beside an invoice in a list. */
export function PieceMark({ piece, className }: { piece: TapePiece; className?: string }) {
	return (
		<span aria-hidden className={cn("relative block h-2.5 w-9 shrink-0 overflow-hidden rounded-full", PIECE[piece.state], className)}>
			{piece.state !== "paid" && piece.filled > 0 ? (
				<span style={{ width: `${piece.filled * 100}%` }} className="absolute inset-y-0 left-0 rounded-full bg-success" />
			) : null}
		</span>
	);
}

const day = (date: string) => formatDay(date, { day: "numeric", month: "short" });

/** Where an invoice stands, in a line: "Issued 30 Oct · due 14 Nov". */
export function pieceStory(piece: TapePiece) {
	if (piece.state === "draft") return "Not issued yet";
	if (piece.state === "paid" && piece.paidOn) return `Issued ${day(piece.issueDate)} · paid ${day(studioDateString(piece.paidOn))}`;
	return `Issued ${day(piece.issueDate)}${piece.dueDate ? ` · due ${day(piece.dueDate)}` : ""}`;
}

/** What an invoice still asks for, coloured like its piece. */
export function PieceStatus({ piece, className }: { piece: TapePiece; className?: string }) {
	const [text, tone] =
		piece.state === "paid"
			? ["Paid", "text-success"]
			: piece.state === "draft"
				? ["Draft", "text-muted-foreground"]
				: piece.state === "overdue"
					? [`${formatMoney(piece.due)} overdue`, "text-destructive"]
					: [`${formatMoney(piece.due)} to collect`, "text-warning"];
	return <span className={cn("text-sm font-medium tabular-nums", tone, className)}>{text}</span>;
}
