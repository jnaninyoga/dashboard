import { LoadingScreen, SkeletonEntityCards, SkeletonPageHeader } from "@/components/skeletons";

// Her discounts (app/(dashboard)/price-list/discounts/page.tsx): the
// heading, then a card each (DiscountGrid): what it takes off, who has it,
// what it makes of her cheapest card.
export default function Loading() {
	return (
		<LoadingScreen label="Loading discounts">
			<SkeletonPageHeader
				title="w-36 md:w-40"
				description={["w-[33rem] max-md:w-full", "w-2/5 md:hidden"]}
				action="max-md:w-full md:w-37 rounded-xl"
			/>
			<SkeletonEntityCards
				// A price list is a few items: one row of them.
				count={3}
				lines={["w-36"]}
				figures={[
					{ label: "w-16", value: "w-14" },
					{ label: "w-12", value: "w-6" },
				]}
				actions="line"
			/>
		</LoadingScreen>
	);
}
