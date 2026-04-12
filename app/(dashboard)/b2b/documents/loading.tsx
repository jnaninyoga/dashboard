import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="flex flex-col gap-8 p-6">
			{/* Header Skeleton */}
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div className="space-y-2">
					<Skeleton className="bg-muted-foreground/10 h-9 w-48" />
					<Skeleton className="bg-muted-foreground/10 h-4 w-64" />
				</div>
			</div>

			{/* Filters Skeleton */}
			<div className="flex items-center gap-2">
				<Skeleton className="bg-muted-foreground/10 h-10 w-full max-w-md" />
				<Skeleton className="bg-muted-foreground/10 h-10 w-32" />
				<Skeleton className="bg-muted-foreground/10 h-10 w-32" />
			</div>

			{/* Content Skeleton (Table Mimic) */}
			<div className="border-secondary/10 bg-card overflow-hidden rounded-3xl border shadow-sm">
				<div className="bg-muted-foreground/5 h-16 w-full border-b" />
				<div className="space-y-0 divide-y divide-secondary/10">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="flex items-center justify-between p-6">
							<div className="flex items-center gap-4">
								<Skeleton className="h-10 w-10 rounded-xl" />
								<div className="space-y-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-3 w-24" />
								</div>
							</div>
							<Skeleton className="h-4 w-40" />
							<Skeleton className="h-6 w-24 rounded-full" />
							<Skeleton className="h-6 w-24" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
