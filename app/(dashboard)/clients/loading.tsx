import { LoadingScreen, SkeletonEntityCards, SkeletonListFilters, SkeletonPageHeader } from "@/components/skeletons";

// The clients' default view (app/(dashboard)/clients/page.tsx): the
// heading, the filters, then ClientCards in the card grid.
export default function Loading() {
	return (
		<LoadingScreen label="Loading clients">
			<SkeletonPageHeader title="w-28 md:w-32" action="w-32" />
			{/* The view toggle only shows from md (ClientViewToggle). */}
			<SkeletonListFilters search="xl:w-[300px]" select="xl:w-[180px]" toggle="hidden md:inline-flex" />
			<SkeletonEntityCards
				media="round"
				lines={["w-32"]}
				figures={[
					{ label: "w-20", value: "w-6", unit: "w-9" },
					{ label: "w-18", value: "w-6", unit: "w-10" },
				]}
				aside
			/>
		</LoadingScreen>
	);
}
