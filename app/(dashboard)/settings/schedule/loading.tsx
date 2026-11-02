import { LoadingScreen, SkeletonField, SkeletonLine, SkeletonPageHeader } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

// The studio's default week (lib/config/schedule.ts): open Monday to
// Saturday, closed on Sunday. Her own week may differ.
const DAYS = [
	{ day: "w-16", open: true },
	{ day: "w-16", open: true },
	{ day: "w-24", open: true },
	{ day: "w-20", open: true },
	{ day: "w-14", open: true },
	{ day: "w-18", open: true },
	{ day: "w-16", open: false },
];

// Studio hours (app/(dashboard)/settings/schedule/page.tsx and
// components/schedule/settings/form.tsx): a day per row, open or closed,
// its bar on the week's time axis, its times.
export default function Loading() {
	return (
		<LoadingScreen label="Loading studio hours">
			<SkeletonPageHeader
				title="w-44 md:w-54"
				description={["w-[66rem] max-md:w-full", "w-full md:hidden", "w-3/4 md:hidden"]}
			/>

			<div className="grid gap-3">
				{/* "Open 6 days, 42 h a week · closed Sunday", and whether it's saved. */}
				<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
					<SkeletonLine className="w-84 text-lg" />
					<SkeletonLine className="w-16 text-sm" />
				</div>

				<div className="bg-card rounded-2xl border">
					{/* The time axis, from md. */}
					<div className="hidden px-4 pt-3 md:grid md:grid-cols-[9rem_1fr_18rem] md:gap-4">
						<span />
						<div className="flex h-4 items-center justify-between text-xs">
							{Array.from({ length: 5 }, (_, i) => (
								<SkeletonLine key={i} className="w-8" />
							))}
						</div>
						<span />
					</div>

					<div className="divide-border divide-y">
						{DAYS.map(({ day, open }, i) => (
							<div key={i} className="grid gap-3 px-4 py-3.5 md:grid-cols-[9rem_1fr_18rem] md:items-center md:gap-4">
								<div className="flex items-center gap-3">
									<Skeleton className="h-[1.15rem] w-8 shrink-0 rounded-full" />
									<SkeletonLine className={day} />
									{/* The day's hours, said on a phone (the bar says it from md). */}
									<SkeletonLine className="ml-auto w-10 text-sm md:hidden" />
								</div>
								{open ? (
									<>
										<div className="bg-muted/70 relative h-2.5 overflow-hidden rounded-full max-md:order-last" />
										<div className="flex items-center gap-2">
											<SkeletonField className="h-10" bar="w-12" />
											<span className="text-muted-foreground" aria-hidden>
												–
											</span>
											<SkeletonField className="h-10" bar="w-12" />
										</div>
									</>
								) : (
									<>
										<span className="max-md:hidden" />
										<SkeletonLine className="w-14 text-sm max-md:hidden" />
									</>
								)}
							</div>
						))}
					</div>
				</div>
			</div>
		</LoadingScreen>
	);
}
