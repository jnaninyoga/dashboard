import { LoadingScreen, SkeletonEntityCards, SkeletonListFilters, SkeletonPageHeader } from "@/components/skeletons";

// The partners' default view (app/(dashboard)/b2b/partners/page.tsx): the
// heading, the filters, then the partner cards (PartnerGrid).
export default function Loading() {
	return (
		<LoadingScreen label="Loading partners">
			<SkeletonPageHeader title="w-32 md:w-36" action="max-md:w-full md:w-34" />
			{/* Unlike the clients', this toggle shows on a phone too. */}
			<SkeletonListFilters search="xl:w-2xs" select="xl:w-48" toggleItem="w-9" />
			{/* The address on its own line, the ICE under it. */}
			<SkeletonEntityCards
				lines={["w-48", "w-32"]}
				figures={[
					{ label: "w-20", value: "w-6" },
					{ label: "w-16", value: "w-6" },
				]}
			/>
		</LoadingScreen>
	);
}
