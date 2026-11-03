import { LoadingScreen, SkeletonPageHeader } from "@/components/skeletons";

// Nothing lives at /settings itself: this shows while one of its pages (the
// business profile, the studio hours) starts loading, before that page's
// own loading screen. It holds what both begin with: their heading.
export default function Loading() {
	return (
		<LoadingScreen label="Loading settings">
			<SkeletonPageHeader title="w-48 md:w-56" description={["w-[36rem] max-md:w-full", "w-2/3 md:hidden"]} />
		</LoadingScreen>
	);
}
