import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<>
			{/* Header Skeleton */}
			<div className="space-y-2">
				<Skeleton className="bg-muted-foreground/10 h-8 w-48" />
				<Skeleton className="bg-muted-foreground/10 h-4 w-72" />
			</div>

			{/* Button Skeleton */}
			<div className="flex justify-end">
				<Skeleton className="bg-muted-foreground/10 h-10 w-36 rounded-xl" />
			</div>

			{/* Table Skeleton */}
			<div className="space-y-0 rounded-md bg-white p-2">
				{/* Header Row */}
				<div className="border-secondary-foreground/10 flex items-center gap-4 border-b px-4 py-3">
					<Skeleton className="bg-muted-foreground/10 h-4 w-24" />
					<Skeleton className="bg-muted-foreground/10 h-4 w-28" />
					<Skeleton className="bg-muted-foreground/10 h-4 w-16" />
					<div className="flex-1" />
					<Skeleton className="bg-muted-foreground/10 h-4 w-16" />
				</div>
				{/* Data Rows */}
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="border-secondary-foreground/10 flex items-center gap-4 border-b px-4 py-3 last:border-0"
					>
						<Skeleton className="bg-muted-foreground/10 h-4 w-28" />
						<Skeleton className="bg-muted-foreground/10 h-4 w-20" />
						<Skeleton className="bg-muted-foreground/10 h-4 w-14" />
						<div className="flex-1" />
						<Skeleton className="bg-muted-foreground/10 h-8 w-8 rounded-md" />
					</div>
				))}
			</div>
		</>
	);
}
