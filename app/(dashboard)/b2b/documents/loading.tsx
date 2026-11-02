import {
	LoadingScreen,
	SkeletonDocumentList,
	SkeletonField,
	SkeletonPageHeader,
} from "@/components/skeletons";

// The documents (app/(dashboard)/b2b/documents/page.tsx): the heading,
// then the list with its search and filters. The "owed" banner only shows
// when something is owed, so it isn't drawn here.
export default function Loading() {
	return (
		<LoadingScreen label="Loading documents">
			<SkeletonPageHeader
				title="w-36 md:w-44"
				description={["w-[34rem] max-md:w-full", "w-1/2 md:hidden"]}
				action="max-md:w-full md:w-38 rounded-full"
			/>
			<SkeletonDocumentList
				who="partner"
				toolbar={
					// DocumentFilters: the search, then three selects (a row from xl).
					<div className="flex min-w-0 flex-1 flex-col gap-3 xl:flex-row xl:items-center">
						<div className="relative flex-1">
							<SkeletonField className="bg-card h-10 pl-10" bar="w-44" />
						</div>
						<div className="grid grid-cols-[1fr_1fr_auto] gap-2 xl:flex xl:items-center">
							<SkeletonField className="bg-card xl:w-44" bar="w-16" select />
							<SkeletonField className="bg-card xl:w-44" bar="w-18" select />
							<SkeletonField className="bg-card xl:w-44" bar="w-16" select />
						</div>
					</div>
				}
			/>
		</LoadingScreen>
	);
}
