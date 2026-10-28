import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { getUserProfile } from "@/lib/utils/user";
import { getValidAccessToken } from "@/services/google";
import { createClient } from "@/services/supabase/server";

export default async function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	// Global Guard: Ensure Google Token is valid and refreshable
	// If this fails, the user must re-authenticate to sync Supabase session with Google
	try {
		await getValidAccessToken(user.id);
	} catch (error) {
		// Token is invalid/expired and could not be refreshed
		console.error("Dashboard Guard: Google Token Invalid", error);
		redirect("/login");
	}

	return (
		<SidebarProvider>
			<AppSidebar user={getUserProfile(user)} />
			<SidebarInset>
				<header className="bg-background/80 border-border/50 sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-xl sm:px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
					<div className="flex items-center gap-2">
						<SidebarTrigger className="-ml-1 min-h-[48px] min-w-[48px]" />
					</div>
				</header>
				<div className="animate-slide-up mx-auto flex w-full max-w-screen-2xl flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
