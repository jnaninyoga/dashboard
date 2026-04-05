import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<>
			{/* Header Skeleton */}
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div className="space-y-2">
					<Skeleton className="bg-muted-foreground/10 h-9 w-32" />
					<Skeleton className="bg-muted-foreground/10 h-4 w-64" />
				</div>
				<Skeleton className="bg-muted-foreground/10 h-10 w-32" />
			</div>

			{/* Filters Skeleton */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="flex gap-2">
					<Skeleton className="bg-muted-foreground/10 h-10 w-[200px]" />
					<Skeleton className="bg-muted-foreground/10 h-10 w-[100px]" />
				</div>
				<Skeleton className="bg-muted-foreground/10 h-10 w-[100px]" />
			</div>

			{/* Content Skeleton (Grid View Mimic) */}
			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<div
						key={i}
						className="border-border/50 flex flex-col space-y-3 rounded-xl border bg-white p-4 shadow-sm"
					>
						<div className="flex items-center gap-4">
							<Skeleton className="bg-muted-foreground/10 h-12 w-12 rounded-full" />
							<div className="space-y-2">
								<Skeleton className="bg-muted-foreground/10 h-4 w-[150px]" />
								<Skeleton className="bg-muted-foreground/10 h-4 w-[100px]" />
							</div>
						</div>
						<div className="space-y-2 pt-4">
							<Skeleton className="bg-muted-foreground/10 h-4 w-full" />
							<Skeleton className="bg-muted-foreground/10 h-4 w-[80%]" />
						</div>
					</div>
				))}
			</div>
		</>
	);
}
