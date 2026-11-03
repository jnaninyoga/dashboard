"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavUser } from "@/components/nav-user";
import { QuickActionsMenu } from "@/components/quick-actions";
import { SidebarPattern } from "@/components/sidebar-pattern";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	useSidebar,
} from "@/components/ui/sidebar";
import { dashboardConfig, isCurrent, type NavItem, SETTINGS_COOKIE } from "@/lib/config/dashboard";
import { cn } from "@/lib/utils/ui";
import { type UserProfile } from "@/lib/utils/user";

import { Add, ArrowDown2, Setting2 } from "iconsax-reactjs";
import { Collapsible } from "radix-ui";

// Pills a thumb can hit in the phone menu, a little tighter on desktop. Hover
// is a faint tint, so the current page (full blush, rose label) stays the one
// that stands out.
const navButton =
	"h-11 gap-3 rounded-full px-3 text-[15px] md:h-9 md:text-sm [&>svg]:size-5 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground active:bg-sidebar-accent/60 active:text-sidebar-foreground data-[active=true]:hover:bg-sidebar-accent data-[active=true]:hover:text-sidebar-accent-foreground";

// A short lift and tilt when she points at an item, a press when she taps it,
// and the filled icon settling in on the current page. None of it under
// reduced motion.
const navIcon =
	"transition-[rotate,scale,translate] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-safe:group-hover/menu-item:-translate-y-px motion-safe:group-hover/menu-item:-rotate-8 motion-safe:group-hover/menu-item:scale-110 motion-safe:group-active/menu-item:scale-90";

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
	const pathname = usePathname();
	const current = isCurrent(pathname, item.url);
	return (
		<SidebarMenuItem>
			<SidebarMenuButton asChild isActive={current} tooltip={item.title} className={navButton}>
				<Link href={item.url} onClick={onNavigate} aria-current={current ? "page" : undefined}>
					<item.icon
						size={20}
						variant={current ? "Bulk" : "Linear"}
						className={cn(navIcon, current && "text-sidebar-primary motion-safe:animate-nav-pop")}
					/>
					<span>{item.title}</span>
				</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}

export function AppSidebar({
	user,
	settingsOpen: settingsOpenAtLoad = false,
	...props
}: React.ComponentProps<typeof Sidebar> & { user: UserProfile; settingsOpen?: boolean }) {
	const pathname = usePathname();
	const { isMobile, setOpenMobile, state } = useSidebar();
	const onSettingsPage = dashboardConfig.settings.some((item) => isCurrent(pathname, item.url));
	const [settingsOpen, setSettingsOpen] = React.useState(settingsOpenAtLoad || onSettingsPage);

	// On phones the sidebar is a sheet over the page: close it once a link
	// is chosen, or it stays covering the screen after navigating.
	const closeOnMobile = () => {
		if (isMobile) setOpenMobile(false);
	};
	const toggleSettings = (open: boolean) => {
		setSettingsOpen(open);
		document.cookie = `${SETTINGS_COOKIE}=${open ? "open" : "closed"}; path=/; max-age=31536000; samesite=lax`;
	};
	const settingsItems = dashboardConfig.settings.map((item) => (
		<NavLink key={item.url} item={item} onNavigate={closeOnMobile} />
	));

	return (
		<Sidebar collapsible="icon" {...props} className="border-r">
			<SidebarPattern />
			<SidebarHeader className="gap-4 p-3 pt-4 group-data-[collapsible=icon]:p-2">
				<Link
					href="/"
					onClick={closeOnMobile}
					className="flex rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
				>
					<div className="flex items-center gap-3 px-1 group-data-[collapsible=icon]:p-0">
						{/* The pale lotus sits on its own tile so the pattern can't swallow it. */}
						<span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-card shadow-sm ring-1 ring-sidebar-border/70 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:ring-0">
							<Image src="/logo.png" alt="JnaninYoga" width={40} height={40} className="size-10 object-contain group-data-[collapsible=icon]:size-8" />
						</span>
						<div className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
							<span className="truncate font-heading text-2xl font-bold tracking-tight text-sidebar-foreground uppercase">
								Jnanin Yoga
							</span>
							<span className="truncate font-heading text-xs font-semibold tracking-widest text-sidebar-foreground/65 uppercase">
								Command Center
							</span>
						</div>
					</div>
				</Link>

				<SidebarMenu>
					<SidebarMenuItem>
						<QuickActionsMenu side={isMobile ? "bottom" : "right"} onChoose={closeOnMobile}>
							<SidebarMenuButton
								tooltip="New"
								className="zen-glow-teal h-11 justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground group-data-[collapsible=icon]:rounded-full hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground data-[state=open]:bg-primary/90 data-[state=open]:text-primary-foreground [&>svg]:size-5"
							>
								<Add className="motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover/menu-item:rotate-90" />
								<span>New</span>
							</SidebarMenuButton>
						</QuickActionsMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent className="scrollbar-thin [scrollbar-color:var(--sidebar-border)_transparent] gap-0">
				{dashboardConfig.sections.map((section) => (
					<SidebarGroup key={section.label} className="px-3 py-1.5 group-data-[collapsible=icon]:px-2">
						<SidebarGroupLabel className="px-3 text-xs text-sidebar-foreground/60">{section.label}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu className="gap-0.5">
								{section.items.map((item) => (
									<NavLink key={item.url} item={item} onNavigate={closeOnMobile} />
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}

				{/* Settings fold away: set up once, visited rarely. With the sidebar
				    down to icons, their icons simply show. */}
				{state === "collapsed" && !isMobile ? (
					<SidebarGroup className="px-2 py-1.5">
						<SidebarMenu className="gap-0.5">{settingsItems}</SidebarMenu>
					</SidebarGroup>
				) : (
					<Collapsible.Root open={settingsOpen} onOpenChange={toggleSettings} asChild>
						<SidebarGroup className="px-3 py-1.5">
							<Collapsible.Trigger asChild>
								<button
									type="button"
									className="group/settings flex h-11 w-full items-center gap-3 rounded-full px-3 text-[15px] text-sidebar-foreground/60 transition-colors outline-none hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring md:h-9 md:text-sm"
								>
									<Setting2 size={20} variant="Linear" className="motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover/settings:rotate-45" />
									<span className="flex-1 text-left">Settings</span>
									<ArrowDown2
										size={16}
										className="transition-transform duration-300 group-data-[state=open]/settings:rotate-180 motion-reduce:transition-none"
									/>
								</button>
							</Collapsible.Trigger>
							<Collapsible.Content className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none">
								<SidebarGroupContent>
									<SidebarMenu className="gap-0.5 pt-0.5 pl-3">{settingsItems}</SidebarMenu>
								</SidebarGroupContent>
							</Collapsible.Content>
						</SidebarGroup>
					</Collapsible.Root>
				)}
			</SidebarContent>
			<SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2">
				<NavUser user={user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
