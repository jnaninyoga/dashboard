"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { signOut } from "@/lib/actions/auth";
import { type UserProfile } from "@/lib/utils/user";

import { ArrowSwapVertical, Logout } from "iconsax-reactjs";

export function NavUser({ user }: { user: UserProfile }) {
	const { isMobile } = useSidebar();

	const avatar = (
		<Avatar className="h-8 w-8 rounded-lg">
			{user.avatarUrl ? (
				<AvatarImage src={user.avatarUrl} alt={user.fullName} />
			) : null}
			<AvatarFallback className="rounded-lg">{user.initials}</AvatarFallback>
		</Avatar>
	);
	const identity = (
		<div className="grid flex-1 text-left text-sm leading-tight">
			<span className="truncate font-semibold">{user.fullName}</span>
			<span className="truncate text-xs">{user.email}</span>
		</div>
	);

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							{avatar}
							{identity}
							<ArrowSwapVertical className="ml-auto size-4" variant="Outline" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								{avatar}
								{identity}
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => signOut()} className="text-destructive bg-destructive/5 hover:bg-destructive/10 focus:bg-destructive/10 cursor-pointer transition-colors">
							<Logout variant="Outline" className="text-destructive" />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
