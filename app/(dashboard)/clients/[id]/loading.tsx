import { LoadingScreen, SkeletonLine, SkeletonTabs } from "@/components/skeletons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** A row of the profile tab (components/clients/tabs/profile.tsx): its icon, a label, the value. */
function InfoRow({ value }: { value: string }) {
	return (
		<div className="bg-muted/30 flex items-center gap-4 rounded-2xl border border-transparent p-3">
			<Skeleton className="size-10 shrink-0 rounded-xl" />
			<div className="flex min-w-0 flex-col">
				<SkeletonLine className="w-20 text-[10px]" />
				<SkeletonLine className={value} />
			</div>
		</div>
	);
}

/** One of the two small boxes under the personal details: referral, client since. */
function InfoBox() {
	return (
		<div className="bg-muted/30 flex flex-col gap-1 rounded-2xl border border-transparent p-3">
			<div className="flex items-center gap-2">
				<Skeleton className="size-4 shrink-0 rounded-sm" />
				<SkeletonLine className="w-16 text-[10px]" />
			</div>
			<SkeletonLine className="w-20 text-sm" />
		</div>
	);
}

/** A card's heading: its icon and name (CardTitle, text-lg). */
function Heading({ width }: { width: string }) {
	return (
		<CardHeader className="pb-4">
			<CardTitle className="flex items-center gap-2 text-lg">
				<Skeleton className="size-5 shrink-0 rounded-md" />
				<SkeletonLine className={width} />
			</CardTitle>
		</CardHeader>
	);
}

// A client's profile (app/(dashboard)/clients/[id]/page.tsx): who they are
// and their card, then the tabs, open on Profile.
export default function Loading() {
	return (
		<LoadingScreen label="Loading the client" className="mx-auto w-full max-w-5xl">
			<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
				<div className="flex items-center gap-4">
					<Skeleton className="size-20 shrink-0 rounded-full" />
					<div className="min-w-0">
						<SkeletonLine className="w-56 text-3xl" />
						{/* Discount and gender (Badge: text-xs, 22px). */}
						<div className="mt-1 flex flex-wrap items-center gap-2">
							<Skeleton className="h-5.5 w-24 rounded-full" />
							<Skeleton className="h-5.5 w-16 rounded-full" />
						</div>
						{/* Credits and their card (Badge: text-sm, 30px). */}
						<div className="mt-3 flex items-center gap-2">
							<Skeleton className="h-7.5 w-24 rounded-full" />
							<Skeleton className="h-7.5 w-32 rounded-full" />
						</div>
					</div>
				</div>
				{/* Edit Profile (outline), then the ⋮ menu's room. */}
				<div className="flex items-center gap-2">
					<div className="bg-muted dark:bg-input/30 dark:border-input flex h-9 w-34 items-center justify-center rounded-md border shadow-xs">
						<SkeletonLine className="w-24 text-sm" />
					</div>
					<span className="size-10 md:size-9" />
				</div>
			</div>

			<div className="bg-border h-px w-full shrink-0" />

			<SkeletonTabs className="grid-cols-3 lg:w-96" tabs={["w-14", "w-12", "w-12"]}>
				<div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-2">
					<Card className="border-none shadow-sm">
						<Heading width="w-44" />
						<CardContent className="grid gap-4">
							<InfoRow value="w-32" />
							<InfoRow value="w-44" />
						</CardContent>
					</Card>
					<Card className="border-none shadow-sm">
						<Heading width="w-36" />
						<CardContent className="grid gap-4">
							<InfoRow value="w-24" />
							<div className="grid grid-cols-2 gap-4">
								<InfoBox />
								<InfoBox />
							</div>
						</CardContent>
					</Card>
					<Card className="md:col-span-2">
						<Heading width="w-48" />
						<CardContent>
							<SkeletonLine className="w-3/4" />
						</CardContent>
					</Card>
				</div>
			</SkeletonTabs>
		</LoadingScreen>
	);
}
