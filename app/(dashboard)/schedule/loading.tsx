import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<>
			{/* Header Skeleton */}
			<header className="flex flex-col space-y-2">
				<Skeleton className="bg-muted-foreground/10 h-9 w-48" />
				<Skeleton className="bg-muted-foreground/10 h-4 w-72" />
			</header>

			{/* Day Tabs Skeleton */}
			<div className="flex gap-2 overflow-hidden">
				{Array.from({ length: 7 }).map((_, i) => (
					<Skeleton
						key={i}
						className="bg-muted-foreground/10 h-10 w-28 shrink-0 rounded-xl"
					/>
				))}
			</div>

			{/* Schedule Cards Skeleton */}
			<div className="space-y-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="border-border/50 flex items-center justify-between rounded-2xl border bg-card p-5 shadow-sm"
					>
						<div className="flex items-center gap-4">
							<Skeleton className="bg-muted-foreground/10 h-12 w-12 rounded-xl" />
							<div className="space-y-2">
								<Skeleton className="bg-muted-foreground/10 h-5 w-40" />
								<Skeleton className="bg-muted-foreground/10 h-4 w-28" />
							</div>
						</div>
						<div className="flex items-center gap-3">
							<Skeleton className="bg-muted-foreground/10 h-8 w-20 rounded-lg" />
							<Skeleton className="bg-muted-foreground/10 h-10 w-24 rounded-xl" />
						</div>
					</div>
				))}
			</div>
		</>
	);
}
