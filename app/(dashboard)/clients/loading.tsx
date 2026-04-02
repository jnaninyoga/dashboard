import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<>
			{/* Header Skeleton */}
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div className="space-y-2">
					<Skeleton className="h-9 w-32 bg-muted-foreground/10" />
					<Skeleton className="h-4 w-64 bg-muted-foreground/10" />
				</div>
				<Skeleton className="h-10 w-32 bg-muted-foreground/10" />
			</div>

			{/* Filters Skeleton */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="flex gap-2">
					<Skeleton className="h-10 w-[200px] bg-muted-foreground/10" />
					<Skeleton className="h-10 w-[100px] bg-muted-foreground/10" />
				</div>
				<Skeleton className="h-10 w-[100px] bg-muted-foreground/10" />
			</div>

			{/* Content Skeleton (Grid View Mimic) */}
			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<div
						key={i}
						className="flex flex-col space-y-3 rounded-xl border border-border/50 p-4 shadow-sm bg-white"
					>
						<div className="flex items-center gap-4">
							<Skeleton className="h-12 w-12 rounded-full bg-muted-foreground/10" />
							<div className="space-y-2">
								<Skeleton className="h-4 w-[150px] bg-muted-foreground/10" />
								<Skeleton className="h-4 w-[100px] bg-muted-foreground/10" />
							</div>
						</div>
						<div className="space-y-2 pt-4">
							<Skeleton className="h-4 w-full bg-muted-foreground/10" />
							<Skeleton className="h-4 w-[80%] bg-muted-foreground/10" />
						</div>
					</div>
				))}
			</div>
		</>
	);
}
