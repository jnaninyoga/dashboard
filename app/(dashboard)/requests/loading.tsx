import { LoadingScreen, SkeletonEntityCards, SkeletonPageHeader } from "@/components/skeletons";

// The requests page (app/(dashboard)/requests/page.tsx): the heading and its
// sentence, then the new requests as cards.
export default function Loading() {
	return (
		<LoadingScreen label="Loading requests">
			<SkeletonPageHeader title="w-36 md:w-44" description={["w-72 h-4"]} />
			<SkeletonEntityCards
				count={3}
				lines={["w-24", "w-40"]}
				figures={[
					{ label: "w-16", value: "w-20" },
					{ label: "w-20", value: "w-24" },
				]}
			/>
		</LoadingScreen>
	);
}
