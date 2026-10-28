"use client";

import { useIsMobile } from "@/lib/hooks/use-mobile";

import { Toaster } from "sileo";

export function FeedbackToaster() {
	const isMobile = useIsMobile();
	// Phones: top, clear of the thumb and of bottom drawers.
	// Desktop: bottom-right, out of the way of the page.
	return (
		<Toaster
			position={isMobile ? "top-center" : "bottom-right"}
			offset={isMobile ? { top: 12 } : 24}
		/>
	);
}
