import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<>
			{/* Header + Action Skeleton */}
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-52 bg-muted-foreground/10" />
					<Skeleton className="h-4 w-72 bg-muted-foreground/10" />
				</div>
				<Skeleton className="h-10 w-40 rounded-xl bg-muted-foreground/10" />
			</div>

			{/* Table Skeleton */}
			<div className="rounded-lg bg-white p-2 space-y-0">
				{/* Header Row */}
				<div className="flex items-center gap-6 px-4 py-3 border-b border-secondary-foreground/10">
					<Skeleton className="h-4 w-28 bg-muted-foreground/10" />
					<Skeleton className="h-4 w-16 bg-muted-foreground/10" />
					<Skeleton className="h-4 w-20 bg-muted-foreground/10" />
					<Skeleton className="h-4 w-16 bg-muted-foreground/10" />
					<div className="flex-1" />
					<Skeleton className="h-4 w-8 bg-muted-foreground/10" />
				</div>
				{/* Data Rows */}
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={i}
						className="flex items-center gap-6 px-4 py-3 border-b border-secondary-foreground/10 last:border-0"
					>
						<Skeleton className="h-4 w-32 bg-muted-foreground/10" />
						<Skeleton className="h-4 w-20 bg-muted-foreground/10" />
						<Skeleton className="h-4 w-20 bg-muted-foreground/10" />
						<Skeleton className="h-4 w-12 bg-muted-foreground/10" />
						<div className="flex-1" />
						<Skeleton className="h-8 w-8 rounded-md bg-muted-foreground/10" />
					</div>
				))}
			</div>
		</>
	);
}
