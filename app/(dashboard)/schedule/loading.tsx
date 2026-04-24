import { Skeleton } from "@/components/ui/skeleton";

// One event card placeholder — matches the remastered card shape
// (rounded-3xl, left accent gradient, right pattern area, title + meta + CTA).
function EventCardSkeleton() {
	return (
		<div className="bg-card border-border/70 relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 md:flex-row md:items-center">
			{/* left edge accent placeholder */}
			<div className="bg-muted-foreground/5 pointer-events-none absolute inset-y-0 left-0 w-32" />
			{/* right pattern placeholder */}
			<div className="bg-muted-foreground/5 pointer-events-none absolute -top-10 -right-16 h-[280px] w-[280px] rounded-full" />

			<div className="relative flex flex-1 flex-col gap-3">
				<Skeleton className="bg-muted-foreground/10 h-5 w-24 rounded-full" />
				<Skeleton className="bg-muted-foreground/15 h-7 w-56" />
				<div className="flex items-center gap-3 pt-1">
					<Skeleton className="bg-muted-foreground/10 h-4 w-28" />
					<Skeleton className="bg-muted-foreground/10 h-4 w-24" />
				</div>
			</div>
			<div className="relative mt-4 md:mt-0">
				<Skeleton className="bg-muted-foreground/15 h-12 w-32 rounded-2xl" />
			</div>
		</div>
	);
}

// Collapsed accordion row — just the date label + count pill + chevron.
function AccordionCollapsedSkeleton() {
	return (
		<div className="bg-card border-border/70 zen-shadow flex items-center justify-between rounded-2xl border px-5 py-4">
			<div className="flex items-center gap-3">
				<Skeleton className="bg-muted-foreground/15 h-6 w-52" />
			</div>
			<div className="flex items-center gap-3">
				<Skeleton className="bg-muted-foreground/10 h-6 w-24 rounded-full" />
				<Skeleton className="bg-muted-foreground/10 h-4 w-4 rounded-full" />
			</div>
		</div>
	);
}

export default function Loading() {
	return (
		<>
			{/* Header */}
			<header className="flex flex-col space-y-2">
				<Skeleton className="bg-muted-foreground/10 h-9 w-48" />
				<Skeleton className="bg-muted-foreground/10 h-4 w-72" />
			</header>

			{/* New Session button (right-aligned) */}
			<div className="flex justify-end">
				<Skeleton className="bg-muted-foreground/15 h-10 w-44 rounded-xl" />
			</div>

			{/* Accordion list — a few collapsed days and one expanded (today) with event cards */}
			<div className="flex flex-col gap-3">
				{/* Expanded (today) */}
				<div className="bg-card border-border/70 zen-shadow rounded-2xl border px-5 pt-4 pb-5">
					<div className="mb-3 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Skeleton className="bg-muted-foreground/15 h-6 w-52" />
							<Skeleton className="bg-primary/20 h-5 w-14 rounded-full" />
						</div>
						<div className="flex items-center gap-3">
							<Skeleton className="bg-muted-foreground/10 h-6 w-24 rounded-full" />
							<Skeleton className="bg-muted-foreground/10 h-4 w-4 rounded-full" />
						</div>
					</div>
					<div className="flex flex-col gap-3 pt-2">
						<EventCardSkeleton />
						<EventCardSkeleton />
					</div>
				</div>
				<AccordionCollapsedSkeleton />
				<AccordionCollapsedSkeleton />
				<AccordionCollapsedSkeleton />
			</div>
		</>
	);
}
