import {
	LoadingScreen,
	SkeletonEventCard,
	SkeletonLine,
	SkeletonPageHeader,
	SkeletonSessionRow,
} from "@/components/skeletons";

// The days of the week (WeekList): what's over is a row, what's ahead its
// full card. Which days have sessions is a guess.
const WEEK = [
	{ day: "w-20", sessions: ["row"] },
	{ day: "w-20", sessions: ["row"] },
	{ day: "w-28", sessions: ["card"] },
	{ day: "w-24", sessions: ["card"] },
	{ day: "w-16", sessions: [] },
	{ day: "w-24", sessions: [] },
	{ day: "w-20", sessions: [] },
];

// Chips' words: All, Group, Private, Outdoor, B2B.
const TYPES = ["w-5", "w-10", "w-12", "w-14", "w-7"];

// This week on the Schedule (app/(dashboard)/schedule/page.tsx).
export default function Loading() {
	return (
		<LoadingScreen label="Loading the schedule">
			{/* Its heading wraps rather than stacks: the button follows the words. */}
			<SkeletonPageHeader
				className="flex-row flex-wrap items-end md:items-end"
				title="w-36 md:w-44"
				description={["w-[30rem] max-md:w-full", "w-28 md:hidden"]}
				action="w-34 rounded-full"
			/>

			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				{/* WeekNav: the arrows either side of the week's dates. */}
				<div className="flex w-full items-center gap-3 lg:w-auto">
					<div className="size-11 shrink-0 rounded-full border border-border/70 bg-card" />
					<div className="flex min-w-0 flex-1 flex-col items-center lg:w-56 lg:flex-none">
						<SkeletonLine className="w-16 text-xs" />
						<SkeletonLine className="w-40 text-lg" />
					</div>
					<div className="size-11 shrink-0 rounded-full border border-border/70 bg-card" />
				</div>
				{/* TypeFilter */}
				<div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:gap-2 sm:px-0">
					{TYPES.map((word) => (
						<div
							key={word}
							className="flex h-10 shrink-0 items-center rounded-full border border-border/70 bg-card px-3 sm:px-4"
						>
							<SkeletonLine className={`${word} text-sm`} />
						</div>
					))}
				</div>
			</div>

			<div className="flex flex-col gap-6">
				{WEEK.map(({ day, sessions }, i) => (
					<div key={i} className="flex flex-col gap-3">
						<div className="flex items-center gap-2.5">
							<SkeletonLine className={`${day} text-xl`} />
							<SkeletonLine className="w-20 text-sm" />
							<SkeletonLine className="ml-auto w-16 text-sm" />
						</div>
						{sessions.map((kind, j) =>
							kind === "row" ? <SkeletonSessionRow key={j} /> : <SkeletonEventCard key={j} />,
						)}
					</div>
				))}
			</div>
		</LoadingScreen>
	);
}
