"use client";
import * as React from "react";
import Image from "next/image";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarGroupContent,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardConfig } from "@/config/dashboard";

interface UserProfile {
	name: string;
	email: string;
	avatar: string;
}

export function AppSidebar({
	user,
	...props
}: React.ComponentProps<typeof Sidebar> & { user: UserProfile }) {
	const pathname = usePathname();

	return (
		<Sidebar collapsible="icon" {...props} className="border-r-secondary-foreground/10">
			<SidebarHeader>
				<div className="flex items-center gap-2 p-2 px-1">
					<div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-transparent">
						<Image src="/logo.png" alt="JnaninYoga Logo" width={40} height={40} className="w-full h-full object-contain drop-shadow-sm" />
					</div>
					<div className="grid flex-1 text-left text-sm leading-tight ml-1">
						<span className="truncate text-2xl text-foreground uppercase font-heading font-bold tracking-tight">Jnanin Yoga</span>
						<span className="truncate text-xs font-semibold text-muted-foreground font-heading uppercase tracking-widest leading-none">Command Center</span>
					</div>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Platform</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{dashboardConfig.navMain.map((item) => {
								const isActive = pathname === item.url;
								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton asChild isActive={isActive}>
											<Link href={item.url}>
												<item.icon size={20} variant={isActive ? "Bulk" : "Outline"} />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup>
					<SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{dashboardConfig.actions.map((item) => {
								const isActive = pathname === item.url;
								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton asChild isActive={isActive}>
											<Link href={item.url}>
												<item.icon size={20} variant={isActive ? "Bulk" : "TwoTone"} />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup>
					<SidebarGroupLabel>Settings</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{dashboardConfig.settings.map((item) => {
								const isActive = pathname === item.url;
								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton asChild isActive={isActive}>
											<Link href={item.url}>
												<item.icon size={20} variant={isActive ? "Bulk" : "Outline"} />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
