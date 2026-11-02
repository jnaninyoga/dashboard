import { LoadingScreen, SkeletonEventCard, SkeletonLine, SkeletonSessionRow } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

// Home as app/(dashboard)/page.tsx lays it out: the greeting, today's
// agenda, the cards to renew and the week (components/dashboard/*). How
// many sessions and renewals there are is a guess: two and three.
export default function Loading() {
	return (
		<LoadingScreen label="Loading home">
			{/* Greeting: the time-of-day tile, hello and today's date. */}
			<div className="flex items-center gap-4">
				<Skeleton className="size-14 shrink-0 rounded-2xl" />
				<div className="min-w-0 space-y-1">
					<SkeletonLine className="w-56 text-3xl md:w-72 md:text-4xl" />
					<SkeletonLine className="w-52" />
				</div>
			</div>

			{/* CockpitClient: the agenda bar, then today's sessions. */}
			<div className="flex flex-col gap-5">
				<div className="bg-card zen-shadow flex items-center justify-between gap-4 rounded-3xl p-5">
					<div className="flex min-w-0 flex-col gap-0.5">
						<SkeletonLine className="w-32 text-lg" />
						<SkeletonLine className="w-20 text-sm" />
					</div>
					<Skeleton className="h-11 w-34 shrink-0 rounded-full" />
				</div>
				<div className="flex flex-col gap-3">
					<SkeletonEventCard />
					<SkeletonEventCard title="w-44" />
				</div>
			</div>

			{/* Renewals: each client, why, WhatsApp and Sell. */}
			<div className="bg-card border-secondary/20 flex flex-col gap-4 rounded-3xl border p-5 sm:p-6">
				<div className="flex flex-col gap-1">
					<SkeletonLine className="w-36 text-xl" />
					<SkeletonLine className="w-52 text-sm" />
				</div>
				<div className="divide-border -mx-2 flex flex-col divide-y">
					{["w-32", "w-40", "w-28"].map((name) => (
						<div key={name} className="flex items-center gap-3 px-2 py-3">
							<div className="flex min-w-0 flex-1 items-center gap-3">
								<Skeleton className="size-10 shrink-0 rounded-full sm:size-11" />
								<div className="flex min-w-0 flex-col">
									<SkeletonLine className={name} />
									<SkeletonLine className="w-36 text-sm" />
								</div>
							</div>
							<Skeleton className="size-11 shrink-0 rounded-full" />
							<Skeleton className="size-11 shrink-0 rounded-full sm:w-13" />
						</div>
					))}
				</div>
			</div>

			{/* WeekStrip: the seven days, then the chosen day's sessions. */}
			<div className="bg-card border-secondary/20 flex flex-col gap-5 rounded-3xl border p-5 sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
					<div className="flex flex-col gap-1">
						<SkeletonLine className="w-28 text-xl" />
						<SkeletonLine className="w-72 text-sm" />
					</div>
					{/* "Open the full schedule" */}
					<div className="-mr-2 flex min-h-10 items-center px-2">
						<SkeletonLine className="w-44 text-sm" />
					</div>
				</div>

				<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
					<div className="grid grid-cols-7 gap-1.5 lg:w-[30rem] lg:shrink-0">
						{Array.from({ length: 7 }, (_, i) => (
							<div key={i} className="flex min-h-20 flex-col items-center justify-center gap-1">
								<SkeletonLine className="w-6 text-xs" />
								<SkeletonLine className="w-5 text-lg leading-none" />
								<Skeleton className="size-5 rounded-full" />
							</div>
						))}
					</div>
					<div className="flex min-w-0 flex-1 flex-col gap-3">
						<div className="flex items-baseline justify-between gap-3">
							<SkeletonLine className="w-16 text-lg" />
							<SkeletonLine className="w-20 text-sm" />
						</div>
						<SkeletonSessionRow />
						<SkeletonSessionRow title="w-32" />
					</div>
				</div>
			</div>
		</LoadingScreen>
	);
}
