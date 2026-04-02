import { AppSidebar } from "@/components/app-sidebar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";

import { getValidAccessToken } from "@/services/google-tokens";

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
				<header className="flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 px-6 sticky top-0 bg-sidebar border border-b-secondary-foreground/10 backdrop-blur-xl z-50">
					<div className="flex items-center gap-2">
						<SidebarTrigger className="-ml-1 min-h-[48px] min-w-[48px]" />
					</div>
				</header>
				<div className="flex flex-1 flex-col max-w-5xl w-full mx-auto animate-slide-up">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
