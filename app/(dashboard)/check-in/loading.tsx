import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<>
			{/* Header Skeleton */}
			<header className="flex flex-col space-y-2">
				<Skeleton className="h-9 w-48 bg-muted-foreground/10" />
				<Skeleton className="h-4 w-80 bg-muted-foreground/10" />
			</header>

			{/* Today's Agenda Card Skeleton */}
			<div className="rounded-2xl border border-border/50 p-6 shadow-sm space-y-4">
				<div className="flex items-center justify-between">
					<div className="space-y-2">
						<Skeleton className="h-5 w-36 bg-muted-foreground/10" />
						<Skeleton className="h-3 w-20 bg-muted-foreground/10" />
					</div>
					<Skeleton className="h-10 w-36 rounded-xl bg-muted-foreground/10" />
				</div>
			</div>

			{/* Session Cards Skeleton */}
			<div className="rounded-2xl border border-border/50 p-6 shadow-sm space-y-6">
				{Array.from({ length: 3 }).map((_, i) => (
					<div
						key={i}
						className="flex items-center justify-between bg-white rounded-2xl p-4"
					>
						<div className="flex items-center gap-4">
							<div className="space-y-2">
								<Skeleton className="h-5 w-20 rounded-full bg-muted-foreground/10" />
								<Skeleton className="h-5 w-32 bg-muted-foreground/10" />
								<div className="flex items-center gap-2">
									<Skeleton className="h-4 w-4 rounded-full bg-muted-foreground/10" />
									<Skeleton className="h-4 w-24 bg-muted-foreground/10" />
								</div>
							</div>
						</div>
						<Skeleton className="h-10 w-24 rounded-xl bg-muted-foreground/10" />
					</div>
				))}
			</div>
		</>
	);
}
