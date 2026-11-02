"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { QuickActionsMenu } from "@/components/quick-actions";
import { PatternLattice } from "@/components/sidebar-pattern";
import { bottomBar, isCurrent, type NavItem } from "@/lib/config/dashboard";
import { cn } from "@/lib/utils/ui";

import { Add } from "iconsax-reactjs";

function BarLink({ item }: { item: NavItem }) {
	const pathname = usePathname();
	const current = isCurrent(pathname, item.match ?? item.url);
	return (
		<Link
			href={item.url}
			aria-current={current ? "page" : undefined}
			className="group flex h-16 flex-col items-center justify-center gap-1 outline-none"
		>
			{/* The sidebar's language: a blush pill and the filled icon for the current page. */}
			<span
				className={cn(
					"group-focus-visible:ring-ring flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-200 group-focus-visible:ring-2",
					current ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/60 group-active:bg-sidebar-accent/60",
				)}
			>
				<item.icon
					size={22}
					variant={current ? "Bulk" : "Linear"}
					className={cn(
						"motion-safe:transition-transform motion-safe:duration-150 motion-safe:group-active:scale-90",
						current && "motion-safe:animate-nav-pop",
					)}
				/>
			</span>
			<span
				className={cn(
					"text-xs leading-none",
					current ? "text-sidebar-accent-foreground font-semibold" : "text-sidebar-foreground/60 font-medium",
				)}
			>
				{item.title}
			</span>
		</Link>
	);
}

/**
 * The phone's main navigation: her daily work in reach of the thumb, with
 * "New" raised in the middle. Clear of the home indicator; desktop has the
 * sidebar instead. It stands on the sidebar's ground (its mist and
 * pattern), apart from the page. The page leaves room for it (--bottom-bar).
 */
export function BottomBar() {
	return (
		<nav
			aria-label="Main"
			className="bg-sidebar/95 border-sidebar-border fixed inset-x-0 bottom-0 isolate z-40 border-t pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_color-mix(in_oklab,var(--shadow-ink)_6%,transparent)] backdrop-blur-xl md:hidden"
		>
			<PatternLattice id="lattice-bottom-bar" className="text-sidebar-primary -z-10 opacity-[0.12]" />
			<div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-2">
				{bottomBar.start.map((item) => (
					<BarLink key={item.url} item={item} />
				))}
				<div className="flex justify-center">
					<QuickActionsMenu side="top" align="center">
						<button
							type="button"
							aria-label="New session, client, card or quotation"
							className="bg-primary text-primary-foreground zen-glow-teal ring-sidebar focus-visible:ring-ring -mt-7 flex size-14 items-center justify-center rounded-full ring-4 outline-none active:scale-95 motion-safe:transition-transform data-[state=open]:[&>svg]:rotate-45"
						>
							<Add size={28} className="motion-safe:transition-transform motion-safe:duration-200" />
						</button>
					</QuickActionsMenu>
				</div>
				{bottomBar.end.map((item) => (
					<BarLink key={item.url} item={item} />
				))}
			</div>
		</nav>
	);
}
