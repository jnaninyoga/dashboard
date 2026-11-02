import { Skeleton } from "@/components/ui/skeleton";

/** A client row: avatar, name and card line, the action at the end. */
function Row({ action = "h-11 w-24 rounded-full" }: { action?: string }) {
	return (
		<div className="flex items-center gap-3 px-4 py-3">
			<Skeleton className="size-11 shrink-0 rounded-full" />
			<div className="flex min-w-0 flex-1 flex-col gap-2">
				<Skeleton className="h-4 w-40 max-w-full" />
				<Skeleton className="h-3.5 w-24" />
			</div>
			<Skeleton className={action} />
		</div>
	);
}

/** The door as it lands: the session's header, the search and the regulars, and who's here. */
export default function Loading() {
	return (
		<div aria-busy="true" className="mx-auto flex w-full max-w-6xl flex-col gap-6">
			<span className="sr-only">Loading the session</span>
			<div aria-hidden className="bg-card border-border/70 flex flex-col gap-3 rounded-3xl border px-5 pt-5 pb-6 sm:px-7 sm:pb-7">
				<Skeleton className="h-4 w-20" />
				<div className="flex gap-2">
					<Skeleton className="h-7 w-28 rounded-full" />
					<Skeleton className="h-7 w-28 rounded-full" />
				</div>
				<Skeleton className="h-9 w-56 max-w-full" />
				<Skeleton className="h-5 w-64 max-w-full" />
			</div>

			<div aria-hidden className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start xl:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
				<div className="flex flex-col gap-6">
					<Skeleton className="h-14 w-full rounded-2xl" />
					<div className="flex flex-col gap-3">
						<div className="flex flex-col gap-2">
							<Skeleton className="h-6 w-32" />
							<Skeleton className="h-4 w-64 max-w-full" />
						</div>
						<div className="bg-card divide-border divide-y rounded-3xl border">
							{Array.from({ length: 4 }, (_, i) => (
								<Row key={i} />
							))}
						</div>
					</div>
				</div>
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-2">
						<Skeleton className="h-6 w-16" />
						<Skeleton className="h-4 w-28" />
					</div>
					<div className="bg-card divide-border divide-y rounded-3xl border">
						{Array.from({ length: 2 }, (_, i) => (
							<Row key={i} action="size-11 rounded-full" />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
