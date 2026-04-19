import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="flex flex-col gap-6 p-6">
			{/* Header Skeleton */}
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div className="space-y-2">
					<Skeleton className="bg-muted-foreground/10 h-9 w-48" />
					<Skeleton className="bg-muted-foreground/10 h-4 w-64" />
				</div>
				<div className="flex items-center gap-3">
					<Skeleton className="bg-muted-foreground/10 h-10 w-24" />
					<Skeleton className="bg-muted-foreground/10 h-10 w-32 shadow-sm" />
				</div>
			</div>

			{/* Filters/Tabs Skeleton */}
			<div className="flex items-center gap-2">
				<Skeleton className="bg-muted-foreground/10 h-10 w-full max-w-md" />
			</div>

			{/* Content Skeleton (Grid View Mimic) */}
			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<div
						key={i}
						className="border-secondary/10 bg-card flex flex-col space-y-4 rounded-3xl border p-6 shadow-sm"
					>
						<div className="flex items-center gap-4">
							<Skeleton className="bg-muted-foreground/10 h-14 w-14 rounded-2xl" />
							<div className="space-y-2">
								<Skeleton className="bg-muted-foreground/10 h-5 w-[150px]" />
								<Skeleton className="bg-muted-foreground/10 h-3 w-[100px]" />
							</div>
						</div>
						<div className="space-y-3 pt-2">
							<Skeleton className="bg-muted-foreground/10 h-4 w-full" />
							<Skeleton className="bg-muted-foreground/10 h-4 w-3/4" />
						</div>
						<div className="flex items-center justify-between pt-2">
							<Skeleton className="bg-muted-foreground/10 h-8 w-24 rounded-full" />
							<Skeleton className="bg-muted-foreground/10 h-8 w-8 rounded-lg" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
