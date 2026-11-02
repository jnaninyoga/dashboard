import { LoadingScreen, SkeletonEntityCards, SkeletonPageHeader } from "@/components/skeletons";

// Her memberships (app/(dashboard)/price-list/memberships/page.tsx): the
// heading, then a card each (ProductGrid): the price, the cards in use,
// when it last sold.
export default function Loading() {
	return (
		<LoadingScreen label="Loading memberships">
			<SkeletonPageHeader
				title="w-40 md:w-48"
				description={["w-[39rem] max-md:w-full", "w-2/3 md:hidden"]}
				action="max-md:w-full md:w-41 rounded-xl"
			/>
			<SkeletonEntityCards
				// A price list is a few items: one row of them.
				count={3}
				lines={["w-32"]}
				figures={[
					{ label: "w-10", value: "w-20" },
					{ label: "w-12", value: "w-6", unit: "w-10" },
				]}
				actions="line"
			/>
		</LoadingScreen>
	);
}
