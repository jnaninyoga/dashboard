import { LoadingScreen, SkeletonEntityCards, SkeletonPageHeader } from "@/components/skeletons";

// Her partner rates (app/(dashboard)/price-list/partner-rates/page.tsx):
// the heading, then a card each (ProductGrid): the price per session, the
// quotations it's on, the last one.
export default function Loading() {
	return (
		<LoadingScreen label="Loading partner rates">
			<SkeletonPageHeader
				title="w-44 md:w-52"
				description={["w-[55rem] max-md:w-full", "w-full md:hidden", "w-1/4 md:hidden"]}
				action="max-md:w-full md:w-30 rounded-xl"
			/>
			<SkeletonEntityCards
				// A price list is a few items: one row of them.
				count={3}
				lines={["w-40"]}
				figures={[
					{ label: "w-20", value: "w-20" },
					{ label: "w-20", value: "w-6" },
				]}
				actions="line"
			/>
		</LoadingScreen>
	);
}
