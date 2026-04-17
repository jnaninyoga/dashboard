import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { getValidAccessToken } from "@/services/google-tokens";
import { createClient } from "@/supabase/server";

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

	const userData = {
		name: user.user_metadata?.full_name || "Admin",
		email: user.email || "admin@jnaninyoga.com",
		avatar: user.user_metadata?.avatar_url || "/avatars/shadcn.jpg",
	};

	return (
		<SidebarProvider>
			<AppSidebar user={userData} />
			<SidebarInset>
				<header className="bg-background/80 border-border/50 sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b px-6 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
					<div className="flex items-center gap-2">
						<SidebarTrigger className="-ml-1 min-h-[48px] min-w-[48px]" />
					</div>
				</header>
				<div className="animate-slide-up mx-auto flex w-full max-w-5xl flex-1 flex-col">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
