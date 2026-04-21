"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavUser } from "@/components/nav-user";
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
} from "@/components/ui/sidebar";
import { dashboardConfig } from "@/lib/config/dashboard";

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
		<Sidebar collapsible="icon" {...props} className="border-r">
			<SidebarHeader>
				<div className="flex items-center gap-2 p-2 px-1">
					<div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-transparent">
						<Image src="/logo.png" alt="JnaninYoga Logo" width={40} height={40} className="h-full w-full object-contain drop-shadow-sm" />
					</div>
					<div className="ml-1 grid flex-1 text-left text-sm leading-tight">
						<span className="text-foreground font-heading truncate text-2xl font-bold tracking-tight uppercase">Jnanin Yoga</span>
						<span className="text-muted-foreground font-heading truncate text-xs leading-none font-semibold tracking-widest uppercase">Command Center</span>
					</div>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Platform</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{dashboardConfig.navMain.map((item) => {
								const isActive = item.url === "/" ? pathname === "/" : pathname === item.url || pathname.startsWith(`${item.url}/`);
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
					<SidebarGroupLabel>B2B / Companies</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{dashboardConfig.b2b.map((item) => {
								const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);
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
								const isActive = item.url === "/" ? pathname === "/" : pathname === item.url || pathname.startsWith(`${item.url}/`);
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
								const isActive = item.url === "/" ? pathname === "/" : pathname === item.url || pathname.startsWith(`${item.url}/`);
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
