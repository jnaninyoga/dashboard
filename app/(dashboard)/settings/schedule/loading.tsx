import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<>
			{/* Header Skeleton */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-44 bg-muted-foreground/10" />
				<Skeleton className="h-4 w-80 bg-muted-foreground/10" />
			</div>

			{/* Schedule Form Skeleton */}
			<div className="rounded-2xl bg-white p-6 space-y-6">
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={i}
						className="flex items-center justify-between border-b border-secondary-foreground/10 pb-4 last:border-0"
					>
						<Skeleton className="h-5 w-24 bg-muted-foreground/10" />
						<div className="flex items-center gap-3">
							<Skeleton className="h-10 w-24 rounded-lg bg-muted-foreground/10" />
							<Skeleton className="h-4 w-4 bg-muted-foreground/10" />
							<Skeleton className="h-10 w-24 rounded-lg bg-muted-foreground/10" />
						</div>
					</div>
				))}
			</div>
		</>
	);
}
