import { LoadingScreen, SkeletonLine } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/** A section's heading row (DocumentSection): the title, its action on the right. */
function Heading({ title, action }: { title: string; action?: string }) {
	return (
		<div className="flex min-h-10 items-center justify-between gap-3">
			<SkeletonLine className={`text-lg ${title}`} />
			{action ? <Skeleton className={`h-10 rounded-xl ${action}`} /> : null}
		</div>
	);
}

/** A framed list of rows, each a label line over a value line (and an action at the end). */
function Rows({ count, label, value, action }: { count: number; label: string; value: string; action?: string }) {
	return (
		<div className="divide-y divide-border rounded-2xl border bg-card">
			{Array.from({ length: count }, (_, i) => (
				<div key={i} className="flex items-center gap-3 px-5 py-3">
					<div className="min-w-0 flex-1">
						<SkeletonLine className={`text-sm ${label}`} />
						<SkeletonLine className={value} />
					</div>
					{action ? <Skeleton className={`shrink-0 ${action}`} /> : null}
				</div>
			))}
		</div>
	);
}

// The client's page as it lands (app/(dashboard)/clients/[id]/page.tsx): the
// header (components/clients/profile/header.tsx), then Cards and Visits in
// the main column, Health and About at the side.
export default function Loading() {
	return (
		<LoadingScreen label="Loading the client" className="mx-auto w-full max-w-6xl gap-8">
			<div className="flex flex-col gap-4">
				<div className="flex h-10 items-center">
					<SkeletonLine className="w-16 text-sm" />
				</div>
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div className="flex items-center gap-4">
						<Skeleton className="size-16 shrink-0 rounded-full md:size-20" />
						<div className="flex flex-col gap-1.5">
							<SkeletonLine className="w-52 font-heading text-3xl leading-tight md:text-4xl" />
							<div className="flex h-7 items-center">
								<SkeletonLine className="w-36 text-sm" />
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Skeleton className="size-11 shrink-0 rounded-full" />
						<Skeleton className="h-11 flex-1 rounded-full md:w-36 md:flex-none" />
						<Skeleton className="size-9 shrink-0 rounded-full" />
					</div>
				</div>
			</div>

			<div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
				<div className="flex min-w-0 flex-col gap-8">
					<div className="space-y-3">
						<Heading title="w-14" action="w-44" />
						<div className="rounded-2xl border bg-card">
							<div className="flex flex-wrap items-end justify-between gap-2 p-5">
								<div>
									<SkeletonLine className="w-24 text-sm" />
									<SkeletonLine className="w-20 font-heading text-5xl leading-none" />
								</div>
								<SkeletonLine className="w-56 text-sm" />
							</div>
							<div className="flex items-start gap-3 border-t px-5 py-4">
								<Skeleton className="size-10 shrink-0 rounded-xl" />
								<div className="min-w-0 flex-1">
									<SkeletonLine className="w-40" />
									<SkeletonLine className="w-32 text-sm" />
									<SkeletonLine className="w-24 text-sm" />
								</div>
							</div>
						</div>
					</div>
					<div className="space-y-3">
						<Heading title="w-14" />
						<Rows count={5} label="w-16" value="w-40" />
					</div>
				</div>
				<div className="flex min-w-0 flex-col gap-8">
					<div className="space-y-3">
						<Heading title="w-16" action="w-32" />
						<Rows count={3} label="w-36" value="w-44" action="h-9 w-24 rounded-lg" />
					</div>
					<div className="space-y-3">
						<Heading title="w-14" />
						<Rows count={5} label="w-20" value="w-40" />
					</div>
				</div>
			</div>
		</LoadingScreen>
	);
}
