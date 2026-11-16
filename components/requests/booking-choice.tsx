import { Money } from "@/components/money";
import { splitChoice } from "@/lib/domain/requests/choice";
import { cn } from "@/lib/utils/ui";
import { type BookingRequest } from "@/services/database/schema";

import { Card, Clock, type Icon, MessageQuestion, Tree } from "iconsax-reactjs";

type Choice = Pick<BookingRequest, "kind" | "choiceLabel">;

const KINDS: Record<BookingRequest["kind"], { label: string; icon: Icon }> = {
	card: { label: "Card", icon: Card },
	class: { label: "Class time", icon: Clock },
	other: { label: "Not sure yet", icon: MessageQuestion },
	event: { label: "Outdoor event", icon: Tree },
};

/**
 * What the visitor would like, set apart: the kind with its icon, the card
 * or class by name, and the price as a price. The panel on a booking's page.
 */
export function BookingChoicePanel({ request, className }: { request: Choice; className?: string }) {
	const { title, amount } = splitChoice(request.choiceLabel);
	const kind = KINDS[request.kind];
	return (
		<div
			className={cn(
				"flex flex-wrap items-center gap-x-4 gap-y-3 rounded-3xl border border-primary/20 bg-primary/5 p-5 sm:p-6",
				className,
			)}
		>
			<span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
				<kind.icon size={28} variant="Bulk" />
			</span>
			<div className="flex min-w-0 flex-1 basis-40 flex-col gap-0.5">
				<span className="text-sm font-medium text-muted-foreground">{kind.label}</span>
				<span className="font-heading text-xl leading-snug font-semibold text-balance text-foreground sm:text-2xl">{title}</span>
			</div>
			{amount ? (
				// Its own row on a phone, so the name keeps its width; beside the name from a tablet up.
				<div className="flex w-full items-baseline justify-between gap-3 border-t border-primary/15 pt-3 sm:ml-auto sm:w-auto sm:border-0 sm:pt-0">
					<span className="text-sm font-medium text-muted-foreground sm:sr-only">Price</span>
					<Money
						amount={amount}
						className="font-heading text-2xl font-bold text-primary sm:text-3xl"
						currencyClassName="text-sm"
					/>
				</div>
			) : null}
		</div>
	);
}

/** The same, on one line for a card or a row: the kind's icon, the name, and the price in a pill. */
export function BookingChoiceLine({ request, className }: { request: Choice; className?: string }) {
	const { title, amount } = splitChoice(request.choiceLabel);
	const kind = KINDS[request.kind];
	return (
		// The price moves under the name rather than squeezing it.
		<span className={cn("flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground", className)}>
			<span className="flex max-w-full min-w-0 items-center gap-2">
				<kind.icon size={16} variant="Bulk" className="shrink-0 text-primary" aria-label={kind.label} />
				<span className="truncate">{title}</span>
			</span>
			{amount ? (
				<Money amount={amount} className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary" />
			) : null}
		</span>
	);
}
