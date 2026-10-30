"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/ui";

/**
 * The page's title in the header, once the page's own heading has scrolled
 * out of sight, so she always knows where she is without the title shown
 * twice at the top. It mirrors the page's first <h1> (a client's name on
 * their profile). Screen readers already have that heading: hidden from them.
 */
export function PageTitle({ className }: { className?: string }) {
	const pathname = usePathname();
	const [title, setTitle] = useState<string | null>(null);
	const [shown, setShown] = useState(false);

	useEffect(() => {
		const content = document.querySelector("[data-page-content]");
		if (!content) return;
		let heading: Element | null = null;
		let visibility: IntersectionObserver | undefined;

		// Pages stream in (a skeleton first), so follow the heading as it arrives.
		const track = () => {
			const next = content.querySelector("h1");
			if (next === heading) return;
			heading = next;
			visibility?.disconnect();
			setTitle(next?.textContent?.trim() || null);
			setShown(false);
			if (!next) return;
			// The sticky header (56px) covers the top of the page.
			visibility = new IntersectionObserver(([entry]) => setShown(!entry.isIntersecting), {
				rootMargin: "-56px 0px 0px 0px",
			});
			visibility.observe(next);
		};
		track();
		const changes = new MutationObserver(track);
		changes.observe(content, { childList: true, subtree: true });
		return () => {
			changes.disconnect();
			visibility?.disconnect();
		};
	}, [pathname]);

	return (
		<span
			aria-hidden
			className={cn(
				"font-heading truncate text-lg font-semibold transition-[opacity,translate] duration-300 motion-reduce:transition-none",
				shown && title ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0",
				className,
			)}
		>
			{title}
		</span>
	);
}
