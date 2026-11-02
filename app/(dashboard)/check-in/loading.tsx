import { Skeleton } from "@/components/ui/skeleton";

/** Today's sessions as they land: the heading, then a session card each. */
export default function Loading() {
	return (
		<div aria-busy="true" className="flex flex-col gap-6">
			<span className="sr-only">Loading today&apos;s sessions</span>
			<div aria-hidden className="flex flex-col gap-2">
				<Skeleton className="h-9 w-40" />
				<Skeleton className="h-5 w-80 max-w-full" />
			</div>
			<div aria-hidden className="flex flex-col gap-3">
				{Array.from({ length: 2 }, (_, i) => (
					<div key={i} className="bg-card border-border/70 flex flex-col gap-4 rounded-3xl border p-6 md:flex-row md:items-center">
						<div className="flex flex-1 flex-col gap-3">
							<Skeleton className="h-6 w-28 rounded-full" />
							<Skeleton className="h-8 w-48 max-w-full" />
							<Skeleton className="h-4 w-56 max-w-full" />
						</div>
						<Skeleton className="h-11 w-32 rounded-full" />
					</div>
				))}
			</div>
		</div>
	);
}
