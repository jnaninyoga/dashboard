import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { BottomBar } from "@/components/bottom-bar";
import { PageTitle } from "@/components/page-title";
import { QuickActionsProvider } from "@/components/quick-actions";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { SETTINGS_COOKIE } from "@/lib/config/dashboard";
import { getUserProfile } from "@/lib/utils/user";
import { getValidAccessToken, isGoogleAccessError, needsReauth } from "@/services/google";
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

	// Only a missing or refused Google token means signing in again. When
	// Google is merely unreachable, the dashboard stays open with a notice.
	let googleUnreachable = false;
	try {
		await getValidAccessToken(user.id);
	} catch (error) {
		if (needsReauth(error)) redirect("/login?reason=google");
		// Anything that isn't Google's doing (the database being down) goes to
		// the error screen rather than being blamed on Google.
		if (!isGoogleAccessError(error)) throw error;
		console.error("Dashboard guard: Google unreachable", error);
		googleUnreachable = true;
	}

	// The sidebar opens as she left it, without a flash on load.
	const cookieStore = await cookies();
	const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";
	const settingsOpen = cookieStore.get(SETTINGS_COOKIE)?.value === "open";

	return (
		<SidebarProvider defaultOpen={sidebarOpen}>
			<QuickActionsProvider>
				<AppSidebar user={getUserProfile(user)} settingsOpen={settingsOpen} />
				{/* min-w-0: wide content (tables) scrolls inside its frame instead of widening the page. */}
				<SidebarInset className="min-w-0">
					<header className="bg-background/80 border-border/50 sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sm:px-6">
						<div className="flex min-w-0 flex-1 items-center gap-2">
							<SidebarTrigger className="-ml-1 min-h-[48px] min-w-[48px]" />
							<PageTitle className="min-w-0" />
						</div>
					</header>
					{googleUnreachable ? (
						<p role="status" className="bg-accent/60 text-foreground border-b px-4 py-2 text-center text-sm sm:px-6">
							Google isn&apos;t answering right now, so your calendar and contacts may be out of date. What you save here is safe.
						</p>
					) : null}
					<div
						data-page-content
						className="animate-slide-up mx-auto flex w-full max-w-screen-2xl flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8"
					>
						{children}
					</div>
					{/* Room for the phone's bottom bar, so the last item on a page isn't under it. */}
					<div aria-hidden className="h-(--bottom-bar) shrink-0 md:hidden" />
				</SidebarInset>
				<BottomBar />
			</QuickActionsProvider>
		</SidebarProvider>
	);
}
