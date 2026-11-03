import { LoadingScreen, SkeletonDocumentList, SkeletonLine, SkeletonTabs } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

// A partner's page (app/(dashboard)/b2b/partners/[id]/page.tsx): the way
// back, the partner's card with its counts, then the tabs, open on
// Documents.
export default function Loading() {
	return (
		<LoadingScreen label="Loading the partner" className="mx-auto w-full max-w-6xl gap-8">
			{/* "Back to Partners" */}
			<SkeletonLine className="w-32 text-sm" />

			<div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-secondary/20 bg-card p-8 shadow-sm md:flex-row">
				<div className="flex flex-col gap-4">
					{/* pr-12: clear of the ⋮ menu. */}
					<div className="flex items-center gap-4 pr-12">
						<Skeleton className="size-16 shrink-0 rounded-2xl" />
						<div className="min-w-0 space-y-1">
							{/* A name in this size wraps on a phone. */}
							<div>
								<SkeletonLine className="w-56 text-4xl" />
								<SkeletonLine className="w-24 text-4xl sm:hidden" />
							</div>
							<SkeletonLine className="w-36 text-sm" />
						</div>
					</div>
					<div className="mt-2 flex max-w-sm items-start gap-2">
						<Skeleton className="mt-0.5 size-4.5 shrink-0 rounded-full" />
						<SkeletonLine className="w-60 text-sm leading-relaxed" />
					</div>
				</div>

				{/* Contacts and documents, counted. */}
				<div className="flex shrink-0 flex-col justify-center gap-3">
					<div className="flex items-center gap-4 rounded-2xl border border-secondary-3/20 bg-secondary/70 px-6 py-4 shadow-xs">
						<div className="flex flex-col items-center">
							<SkeletonLine className="w-6 text-2xl" />
							<SkeletonLine className="w-18 text-xs" />
						</div>
						<div className="mx-2 h-8 w-px bg-secondary-3/20" />
						<div className="flex flex-col items-center">
							<SkeletonLine className="w-6 text-2xl" />
							<SkeletonLine className="w-10 text-xs" />
						</div>
					</div>
				</div>
			</div>

			<SkeletonTabs className="grid-cols-2 lg:w-80" tabs={["w-20", "w-18"]}>
				{/* DocumentsTab: its heading and button, then the partner's documents. */}
				<div className="space-y-6">
					<div className="flex items-center justify-between px-2">
						<div className="flex items-center gap-2">
							<Skeleton className="size-6 shrink-0 rounded-lg" />
							<SkeletonLine className="w-28 text-xl" />
						</div>
						<Skeleton className="h-9 w-32 rounded-xl" />
					</div>
					<SkeletonDocumentList who="contact" rows={4} />
				</div>
			</SkeletonTabs>
		</LoadingScreen>
	);
}
