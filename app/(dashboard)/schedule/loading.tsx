import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<>
			{/* Header Skeleton */}
			<header className="flex flex-col space-y-2">
				<Skeleton className="h-9 w-48 bg-muted-foreground/10" />
				<Skeleton className="h-4 w-72 bg-muted-foreground/10" />
			</header>

			{/* Day Tabs Skeleton */}
			<div className="flex gap-2 overflow-hidden">
				{Array.from({ length: 7 }).map((_, i) => (
					<Skeleton
						key={i}
						className="h-10 w-28 rounded-xl bg-muted-foreground/10 shrink-0"
					/>
				))}
			</div>

			{/* Schedule Cards Skeleton */}
			<div className="space-y-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="flex items-center justify-between rounded-2xl border border-border/50 p-5 shadow-sm bg-white"
					>
						<div className="flex items-center gap-4">
							<Skeleton className="h-12 w-12 rounded-xl bg-muted-foreground/10" />
							<div className="space-y-2">
								<Skeleton className="h-5 w-40 bg-muted-foreground/10" />
								<Skeleton className="h-4 w-28 bg-muted-foreground/10" />
							</div>
						</div>
						<div className="flex items-center gap-3">
							<Skeleton className="h-8 w-20 rounded-lg bg-muted-foreground/10" />
							<Skeleton className="h-10 w-24 rounded-xl bg-muted-foreground/10" />
						</div>
					</div>
				))}
			</div>
		</>
	);
}
