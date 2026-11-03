import Link from "next/link";

import { cn } from "@/lib/utils/ui";

/**
 * The dashboard's one card language (clients, partners, …): a quiet surface,
 * the menu in the top-right corner, then three sections: who (header), the
 * figures that matter, and what to do next. In an EntityCardGrid the
 * sections line up across a row of cards (subgrid), whatever each holds.
 */
export function EntityCardGrid({ children }: { children: React.ReactNode }) {
	return (
		<div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-4">
			{children}
		</div>
	);
}

export function EntityCard({
	menu,
	header,
	figures,
	actions,
}: {
	menu?: React.ReactNode;
	header: React.ReactNode;
	figures: React.ReactNode;
	actions: React.ReactNode;
}) {
	return (
		<article className="hover:zen-shadow-md relative row-span-3 grid grid-cols-1 grid-rows-subgrid gap-5 rounded-3xl border border-secondary/20 bg-card p-6 transition-shadow duration-300">
			{menu ? <div className="absolute top-4 right-4 z-20">{menu}</div> : null}
			<div className={cn(menu && "pr-10")}>{header}</div>
			<div>{figures}</div>
			{/* Above the card's link layer, at the bottom of their row. */}
			<div className="relative z-10 flex items-end">{actions}</div>
		</article>
	);
}

const titleClass =
	"font-heading text-foreground hover:text-primary focus-visible:after:ring-ring line-clamp-2 text-left text-xl leading-snug font-bold transition-colors outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:ring-2";

/**
 * Picture, title and a status line. The title covers the whole card: a link
 * to its page (`href`), or a button that opens it in place (`onOpen`).
 */
export function EntityCardHeader({
	media,
	title,
	href,
	onOpen,
	children,
}: {
	media: React.ReactNode;
	title: string;
	children?: React.ReactNode;
} & ({ href: string; onOpen?: never } | { onOpen: () => void; href?: never })) {
	return (
		<div className="flex items-start gap-4">
			<div className="relative shrink-0">{media}</div>
			<div className="flex min-w-0 flex-col gap-1.5 pt-0.5">
				{href ? (
					<Link href={href} title={title} className={titleClass}>
						{title}
					</Link>
				) : (
					<button type="button" onClick={onOpen} title={title} className={cn(titleClass, "cursor-pointer")}>
						{title}
					</button>
				)}
				{children ? <div className="flex flex-wrap items-center gap-1.5">{children}</div> : null}
			</div>
		</div>
	);
}

/**
 * The figures panel: two figures side by side on a soft neutral surface, and
 * an optional status control at its end (the client's health alerts).
 */
export function EntityCardFigures({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
	return (
		<div className="flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3.5">
			<dl className="grid min-w-0 flex-1 grid-cols-2 gap-4">{children}</dl>
			{aside ? <div className="relative z-10 shrink-0">{aside}</div> : null}
		</div>
	);
}

/** One figure: a label, a large number and its unit. */
export function Figure({
	label,
	value,
	unit,
	tone,
}: {
	label: string;
	value: React.ReactNode;
	unit?: string;
	tone?: "low" | "muted" | "alert";
}) {
	return (
		<div className="flex min-w-0 flex-col gap-1">
			<dt className="text-sm text-muted-foreground">{label}</dt>
			<dd className="flex flex-wrap items-baseline gap-x-1.5">
				<span
					className={cn(
						tone === "muted"
							? "text-base font-medium text-muted-foreground"
							: "text-2xl leading-none font-semibold whitespace-nowrap tabular-nums",
						tone === "low" && "text-warning",
						tone === "alert" && "text-destructive",
					)}
				>
					{value}
				</span>
				{/* A unit moves under its figure whole, never word by word. */}
				{unit ? <span className="text-sm whitespace-nowrap text-muted-foreground">{unit}</span> : null}
			</dd>
		</div>
	);
}
