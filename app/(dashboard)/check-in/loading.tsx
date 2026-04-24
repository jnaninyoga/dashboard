import { Skeleton } from "@/components/ui/skeleton";

// Matches the remastered event card: rounded-3xl, left gradient, right pattern, CTA.
function EventCardSkeleton() {
	return (
		<div className="bg-card border-border/70 relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 md:flex-row md:items-center">
			<div className="bg-muted-foreground/5 pointer-events-none absolute inset-y-0 left-0 w-32" />
			<div className="bg-muted-foreground/5 pointer-events-none absolute -top-10 -right-16 h-[280px] w-[280px] rounded-full" />

			<div className="relative flex flex-1 flex-col gap-3">
				<Skeleton className="bg-muted-foreground/10 h-5 w-24 rounded-full" />
				<Skeleton className="bg-muted-foreground/15 h-7 w-56" />
				<div className="flex items-center gap-3 pt-1">
					<Skeleton className="bg-muted-foreground/10 h-4 w-28" />
					<Skeleton className="bg-muted-foreground/10 h-4 w-32" />
				</div>
			</div>
			<div className="relative mt-4 md:mt-0">
				<Skeleton className="bg-muted-foreground/15 h-12 w-32 rounded-2xl" />
			</div>
		</div>
	);
}

export default function Loading() {
	return (
		<>
			{/* Page header */}
			<header className="flex flex-col space-y-2">
				<Skeleton className="bg-muted-foreground/10 h-9 w-56" />
				<Skeleton className="bg-muted-foreground/10 h-4 w-96" />
			</header>

			{/* Today's Agenda bar (matches CockpitClient's top card: title + count + CTA) */}
			<div className="bg-card zen-shadow flex items-center justify-between rounded-3xl p-5">
				<div className="flex flex-col gap-2">
					<Skeleton className="bg-muted-foreground/15 h-5 w-36" />
					<Skeleton className="bg-muted-foreground/10 h-3 w-24" />
				</div>
				<Skeleton className="bg-muted-foreground/15 h-12 w-40 rounded-full" />
			</div>

			{/* Session cards */}
			<div className="flex flex-col gap-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<EventCardSkeleton key={i} />
				))}
			</div>
		</>
	);
}
