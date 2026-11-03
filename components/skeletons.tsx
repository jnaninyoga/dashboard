import { EntityCardGrid } from "@/components/entity-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils/ui";

/*
 * Loading screens, built from the pages' own shapes. Each piece mirrors a
 * real component (named on it): its paddings, radii, gaps and breakpoints,
 * so nothing moves when the page arrives. Change one with the other.
 *
 * Surfaces she sees as frames (inputs, chips, tabs) keep their frame with a
 * bar where their text goes; solid things (buttons, photos, tiles) are a
 * block of their shape.
 */

/**
 * The loading screen's one region: it names what's loading for screen
 * readers, the bars stay silent. It lays its children out like the
 * sections' layouts do (a column, 24px apart).
 */
export function LoadingScreen({
	label,
	className,
	children,
}: {
	/** "Loading clients". */
	label: string;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div role="status" aria-busy="true" className={cn("flex flex-1 flex-col gap-6", className)}>
			<span className="sr-only">{label}</span>
			{children}
		</div>
	);
}

/**
 * A line of text still to come. Give it the real text's type classes and a
 * width: a zero-width space gives it that text's line height and baseline,
 * and the bar sits across the line where the letters will.
 */
export function SkeletonLine({ className }: { className?: string }) {
	return (
		<div aria-hidden className={cn("relative max-w-full", className)}>
			{"\u200B"}
			<Skeleton className="absolute inset-x-0 top-1/2 h-[0.7em] -translate-y-1/2 rounded-full" />
		</div>
	);
}

/**
 * The pages' heading: the title and its description on the left, the main
 * action (an h-11 button) on the right from md up, under it on a phone.
 * The description is given line by line, since it wraps on a phone: a line
 * only there says so ("w-2/3 md:hidden").
 */
export function SkeletonPageHeader({
	title,
	description = [],
	action,
	className,
}: {
	/** The title's width. */
	title: string;
	/** One entry per line: its width and type classes. */
	description?: string[];
	/** The action's width and radius. */
	action?: string;
	className?: string;
}) {
	return (
		<div className={cn("flex flex-col justify-between gap-4 md:flex-row md:items-center", className)}>
			{/* min-w-0: like wrapping text, the bars give way to the action. */}
			<div className="min-w-0 space-y-1">
				<SkeletonLine className={cn("text-3xl md:text-4xl", title)} />
				{description.length ? (
					<div>
						{description.map((line, i) => (
							<SkeletonLine key={i} className={line} />
						))}
					</div>
				) : null}
			</div>
			{action ? <Skeleton className={cn("h-11 shrink-0", action)} /> : null}
		</div>
	);
}

/** An input or a select: its frame, a bar where its value goes. */
export function SkeletonField({
	className,
	bar = "w-1/2",
	select = false,
}: {
	className?: string;
	bar?: string;
	/** Keeps the room of a select's chevron. */
	select?: boolean;
}) {
	return (
		<div
			aria-hidden
			className={cn(
				"flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-input px-3 shadow-xs dark:bg-input/30",
				className,
			)}
		>
			<SkeletonLine className={cn("text-sm", bar)} />
			{select ? <span className="ml-auto size-4 shrink-0" /> : null}
		</div>
	);
}

/** The grid/table toggle of the clients and partners lists, the grid chosen. */
export function SkeletonViewToggle({ className, item = "w-10" }: { className?: string; item?: string }) {
	return (
		<div aria-hidden className={cn("inline-flex w-fit gap-1 rounded-2xl bg-card p-1 shadow-sm", className)}>
			<div className={cn("flex h-9 items-center justify-center", item)}>
				<Skeleton className="size-4 rounded-sm" />
			</div>
			<Skeleton className={cn("h-9 rounded-xl", item)} />
		</div>
	);
}

/**
 * The search and filters above the clients and partners lists (their
 * filters.tsx, the same on both), the view toggle at the end.
 */
export function SkeletonListFilters({
	search,
	select,
	toggle,
	toggleItem,
}: {
	/** The search box's width from xl. */
	search: string;
	/** Each select's width from xl. */
	select: string;
	toggle?: string;
	toggleItem?: string;
}) {
	return (
		<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
			<div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
				<SkeletonField className={cn("w-full bg-card sm:w-64", search)} bar="w-28" />
				<div className="flex w-full gap-3 sm:w-auto">
					<SkeletonField className={cn("w-full bg-card sm:w-40", select)} bar="w-20" select />
					<SkeletonField className={cn("w-full bg-card sm:w-40", select)} bar="w-20" select />
				</div>
			</div>
			<SkeletonViewToggle className={toggle} item={toggleItem} />
		</div>
	);
}

type SkeletonFigureShape = {
	/** Widths of the label, the number and its unit (none without). */
	label?: string;
	value?: string;
	unit?: string;
};

/** Figure (components/entity-card.tsx): a label, a large number, its unit. */
function SkeletonFigure({ label = "w-20", value = "w-10", unit }: SkeletonFigureShape) {
	return (
		<div className="flex min-w-0 flex-col gap-1">
			<SkeletonLine className={cn("text-sm", label)} />
			{/* The unit sits on the number's baseline, as it does on the card. */}
			<div className="flex items-baseline gap-1.5">
				<SkeletonLine className={cn("text-2xl leading-none", value)} />
				{unit ? <SkeletonLine className={cn("text-sm", unit)} /> : null}
			</div>
		</div>
	);
}

type SkeletonEntityCardShape = {
	/** A client's photo, or the tile of a kind of thing (partner, membership). */
	media?: "round" | "tile";
	/** The title's width. */
	title?: string;
	/** The status lines under the title, by width. */
	lines?: string[];
	/** The two figures. */
	figures?: [SkeletonFigureShape, SkeletonFigureShape];
	/** The figures keep a 44px slot at their end (a client's health alerts). */
	aside?: boolean;
	/** What closes the card: a call button and a wide one, or a line of text. */
	actions?: "buttons" | "line";
};

/**
 * EntityCard (components/entity-card.tsx): who, the figures, what to do
 * next, lined up across a row of cards. Its title keeps clear of the menu.
 */
export function SkeletonEntityCard({
	media = "tile",
	title = "w-40",
	lines = ["w-36"],
	figures = [{}, {}],
	aside = false,
	actions = "buttons",
}: SkeletonEntityCardShape) {
	return (
		<div className="relative row-span-3 grid grid-cols-1 grid-rows-subgrid gap-5 rounded-3xl border border-secondary/20 bg-card p-6">
			{/* EntityCardHeader */}
			<div className="flex items-start gap-4 pr-10">
				<Skeleton className={cn("size-14 shrink-0", media === "round" ? "rounded-full" : "rounded-2xl")} />
				<div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
					<SkeletonLine className={cn("text-xl leading-snug", title)} />
					{lines.length ? (
						<div className="flex flex-col gap-1.5">
							{lines.map((line, i) => (
								<SkeletonLine key={i} className={cn("text-sm", line)} />
							))}
						</div>
					) : null}
				</div>
			</div>

			{/* EntityCardFigures */}
			<div className="flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3.5">
				<div className="grid min-w-0 flex-1 grid-cols-2 gap-4">
					<SkeletonFigure {...figures[0]} />
					<SkeletonFigure {...figures[1]} />
				</div>
				{aside ? <span className="block size-11 shrink-0" /> : null}
			</div>

			<div className="flex items-end">
				{actions === "buttons" ? (
					<div className="flex w-full items-center gap-3">
						<Skeleton className="size-11 shrink-0 rounded-full" />
						<Skeleton className="h-11 flex-1 rounded-full" />
					</div>
				) : (
					<SkeletonLine className="w-44 text-sm" />
				)}
			</div>
		</div>
	);
}

// Names of different lengths, so a grid of placeholders doesn't look stamped.
const TITLES = ["w-40", "w-32", "w-44", "w-36", "w-28", "w-40"];

/** A grid of EntityCards in the real EntityCardGrid, as many as fill a screen. */
export function SkeletonEntityCards({ count = 6, ...card }: SkeletonEntityCardShape & { count?: number }) {
	return (
		<EntityCardGrid>
			{Array.from({ length: count }, (_, i) => (
				<SkeletonEntityCard key={i} {...card} title={TITLES[i % TITLES.length]} />
			))}
		</EntityCardGrid>
	);
}

export type SkeletonColumn = {
	/** The heading's width (and alignment: "ml-auto" on the right). */
	head: string;
	/** The column's own classes (its meta.className). */
	className?: string;
	/** What one of its cells holds. */
	cell: React.ReactNode;
};

/**
 * DataTable (components/data-table.tsx): a card per row below `cardsBelow`,
 * the table from there up, and the count line under both.
 */
export function SkeletonDataTable({
	columns,
	card,
	rows = 6,
	toolbar,
	cardsBelow = "md",
}: {
	columns: SkeletonColumn[];
	/** One row as a phone card (what the page's renderCard draws). */
	card: React.ReactNode;
	rows?: number;
	toolbar?: React.ReactNode;
	cardsBelow?: "md" | "xl";
}) {
	const list = Array.from({ length: rows }, (_, i) => i);
	return (
		<div className="flex flex-col gap-4">
			{toolbar ? <div className="flex flex-col gap-3 md:flex-row md:items-center">{toolbar}</div> : null}

			<div aria-hidden className={cn("grid grid-cols-1 gap-3", cardsBelow === "md" ? "md:hidden" : "xl:hidden")}>
				{list.map((i) => (
					<div key={i} className="min-w-0 rounded-3xl border border-secondary/20 bg-card p-4 shadow-sm">
						{card}
					</div>
				))}
			</div>

			{/* The real table parts, so the columns share out the width as they will. */}
			<div aria-hidden className={cardsBelow === "md" ? "hidden md:block" : "hidden xl:block"}>
				<Table containerClassName="overflow-x-auto border-secondary/20">
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							{columns.map((column, i) => (
								<TableHead key={i} className={cn("px-3 whitespace-nowrap first:pl-5 last:pr-5", column.className)}>
									<SkeletonLine className={column.head} />
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody className="divide-y divide-secondary/15">
						{list.map((i) => (
							<TableRow key={i} className="border-none hover:bg-transparent">
								{columns.map((column, j) => (
									<TableCell
										key={j}
										className={cn("p-3 whitespace-nowrap first:pl-5 last:pr-5", column.className)}
									>
										{column.cell}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* "12 documents" */}
			<div className="flex items-center justify-between gap-3 px-1">
				<SkeletonLine className="w-24 text-sm" />
			</div>
		</div>
	);
}

/** DocumentCell (components/b2b/documents/dashboard-table.tsx): its tile, number, kind and date. */
function SkeletonDocumentCell() {
	return (
		<div className="flex min-w-0 items-center gap-3">
			<Skeleton className="size-10 shrink-0 rounded-xl" />
			<div className="flex min-w-0 flex-col">
				<SkeletonLine className="w-28" />
				<SkeletonLine className="w-36" />
			</div>
		</div>
	);
}

/** AmountCell: the total, and under it what's still due or that it's paid. */
function SkeletonAmount({ inTable = false }: { inTable?: boolean }) {
	return (
		<div className="flex flex-col items-end">
			<SkeletonLine className={inTable ? "w-20" : "w-24"} />
			<SkeletonLine className="w-20 text-sm" />
		</div>
	);
}

/** DocumentRowCard: a document on a phone. */
function SkeletonDocumentCard() {
	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-start gap-3">
				<Skeleton className="size-10 shrink-0 rounded-xl" />
				<div className="flex min-w-0 flex-1 flex-col">
					<SkeletonLine className="w-32" />
					<SkeletonLine className="w-44 text-sm" />
				</div>
			</div>
			<div className="flex items-end justify-between gap-3 border-t border-border/60 pt-3">
				<Skeleton className="h-7 w-24 rounded-full" />
				<SkeletonAmount />
			</div>
		</div>
	);
}

/**
 * A list of documents, the dashboard's (with each partner) or a partner's
 * own (with the contact): the same columns, cards on a phone.
 */
export function SkeletonDocumentList({
	who,
	rows,
	toolbar,
}: {
	/** The second column: the partner and its contact, or the contact alone. */
	who: "partner" | "contact";
	rows?: number;
	toolbar?: React.ReactNode;
}) {
	return (
		<SkeletonDataTable
			rows={rows}
			toolbar={toolbar}
			card={<SkeletonDocumentCard />}
			columns={[
				{ head: "w-20", className: "w-full max-w-0", cell: <SkeletonDocumentCell /> },
				{
					head: "w-16",
					className: "px-5",
					cell:
						who === "partner" ? (
							<div className="flex flex-col">
								<SkeletonLine className="w-32" />
								<SkeletonLine className="w-24" />
							</div>
						) : (
							<SkeletonLine className="w-28" />
						),
				},
				{ head: "w-12", className: "px-5", cell: <Skeleton className="h-7 w-24 rounded-full" /> },
				{ head: "ml-auto w-14", cell: <SkeletonAmount inTable /> },
			]}
		/>
	);
}

/**
 * A profile's tabs (the client's and the partner's ProfileTabs): the bar of
 * equal tabs, the first one open, then what it shows.
 */
export function SkeletonTabs({
	tabs,
	className,
	children,
}: {
	/** One width per tab's name. */
	tabs: string[];
	/** The bar's columns and width ("grid-cols-3 lg:w-96"). */
	className: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-2">
			<div aria-hidden className={cn("mb-6 grid h-11 w-full items-center gap-2 rounded-2xl border bg-card p-1", className)}>
				{tabs.map((tab, i) => (
					<div
						key={i}
						className={cn(
							"flex h-[calc(100%-1px)] items-center justify-center rounded-xl border",
							i === 0 ? "border-border/30 bg-secondary" : "bg-background",
						)}
					>
						<SkeletonLine className={cn("text-xs", tab)} />
					</div>
				))}
			</div>
			{children}
		</div>
	);
}

/** EventCard (components/schedule/events/card.tsx): a session still ahead, with its check-in button. */
export function SkeletonEventCard({ title = "w-56" }: { title?: string }) {
	return (
		<div className="zen-shadow relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-border/70 bg-card py-6 md:flex-row md:items-center">
			<div className="relative flex flex-1 flex-col justify-center p-6">
				{/* The kind's badge (23px: 10px type on a 1.5 line, py-1). */}
				<div className="mb-3 flex items-center gap-3">
					<Skeleton className="h-5.75 w-24 rounded-full" />
				</div>
				<SkeletonLine className={cn("text-2xl leading-tight md:text-[1.7rem]", title)} />
				<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
					<SkeletonLine className="w-24" />
					<SkeletonLine className="w-32" />
				</div>
			</div>
			<div className="relative mt-auto p-5 md:mt-0 md:p-6 md:pl-0">
				<Skeleton className="h-12 w-full rounded-2xl md:h-11 md:w-29" />
			</div>
		</div>
	);
}

/** SessionRow (components/schedule/week-list.tsx): a session that's over: when, what, who came. */
export function SkeletonSessionRow({ title = "w-40" }: { title?: string }) {
	return (
		<div className="flex min-h-16 items-center gap-3 rounded-2xl border border-border/60 bg-card/70 px-4 py-3">
			<div className="w-23 shrink-0 self-start pt-0.5">
				<SkeletonLine className="w-20 text-sm" />
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<SkeletonLine className={title} />
				<SkeletonLine className="w-28 text-sm" />
			</div>
			<span className="size-4 shrink-0" />
		</div>
	);
}
