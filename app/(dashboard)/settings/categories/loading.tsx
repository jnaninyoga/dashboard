import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<>
			{/* Header Skeleton */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-48 bg-muted-foreground/10" />
				<Skeleton className="h-4 w-72 bg-muted-foreground/10" />
			</div>

			{/* Button Skeleton */}
			<div className="flex justify-end">
				<Skeleton className="h-10 w-36 rounded-xl bg-muted-foreground/10" />
			</div>

			{/* Table Skeleton */}
			<div className="rounded-md bg-white p-2 space-y-0">
				{/* Header Row */}
				<div className="flex items-center gap-4 px-4 py-3 border-b border-secondary-foreground/10">
					<Skeleton className="h-4 w-24 bg-muted-foreground/10" />
					<Skeleton className="h-4 w-28 bg-muted-foreground/10" />
					<Skeleton className="h-4 w-16 bg-muted-foreground/10" />
					<div className="flex-1" />
					<Skeleton className="h-4 w-16 bg-muted-foreground/10" />
				</div>
				{/* Data Rows */}
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="flex items-center gap-4 px-4 py-3 border-b border-secondary-foreground/10 last:border-0"
					>
						<Skeleton className="h-4 w-28 bg-muted-foreground/10" />
						<Skeleton className="h-4 w-20 bg-muted-foreground/10" />
						<Skeleton className="h-4 w-14 bg-muted-foreground/10" />
						<div className="flex-1" />
						<Skeleton className="h-8 w-8 rounded-md bg-muted-foreground/10" />
					</div>
				))}
			</div>
		</>
	);
}
