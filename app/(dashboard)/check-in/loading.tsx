import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<>
			{/* Header Skeleton */}
			<header className="flex flex-col space-y-2">
				<Skeleton className="bg-muted-foreground/10 h-9 w-48" />
				<Skeleton className="bg-muted-foreground/10 h-4 w-80" />
			</header>

			{/* Today's Agenda Card Skeleton */}
			<div className="border-border/50 space-y-4 rounded-2xl border p-6 shadow-sm">
				<div className="flex items-center justify-between">
					<div className="space-y-2">
						<Skeleton className="bg-muted-foreground/10 h-5 w-36" />
						<Skeleton className="bg-muted-foreground/10 h-3 w-20" />
					</div>
					<Skeleton className="bg-muted-foreground/10 h-10 w-36 rounded-xl" />
				</div>
			</div>

			{/* Session Cards Skeleton */}
			<div className="border-border/50 space-y-6 rounded-2xl border p-6 shadow-sm">
				{Array.from({ length: 3 }).map((_, i) => (
					<div
						key={i}
						className="flex items-center justify-between rounded-2xl bg-card p-4"
					>
						<div className="flex items-center gap-4">
							<div className="space-y-2">
								<Skeleton className="bg-muted-foreground/10 h-5 w-20 rounded-full" />
								<Skeleton className="bg-muted-foreground/10 h-5 w-32" />
								<div className="flex items-center gap-2">
									<Skeleton className="bg-muted-foreground/10 h-4 w-4 rounded-full" />
									<Skeleton className="bg-muted-foreground/10 h-4 w-24" />
								</div>
							</div>
						</div>
						<Skeleton className="bg-muted-foreground/10 h-10 w-24 rounded-xl" />
					</div>
				))}
			</div>
		</>
	);
}
