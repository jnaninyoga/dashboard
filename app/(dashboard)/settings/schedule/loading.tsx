import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<>
			{/* Header Skeleton */}
			<div className="space-y-2">
				<Skeleton className="bg-muted-foreground/10 h-8 w-44" />
				<Skeleton className="bg-muted-foreground/10 h-4 w-80" />
			</div>

			{/* Schedule Form Skeleton */}
			<div className="bg-card space-y-6 rounded-2xl p-6">
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={i}
						className="border-secondary-foreground/10 flex items-center justify-between border-b pb-4 last:border-0"
					>
						<Skeleton className="bg-muted-foreground/10 h-5 w-24" />
						<div className="flex items-center gap-3">
							<Skeleton className="bg-muted-foreground/10 h-10 w-24 rounded-lg" />
							<Skeleton className="bg-muted-foreground/10 h-4 w-4" />
							<Skeleton className="bg-muted-foreground/10 h-10 w-24 rounded-lg" />
						</div>
					</div>
				))}
			</div>
		</>
	);
}
