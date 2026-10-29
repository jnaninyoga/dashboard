import { CockpitClient } from "@/components/dashboard/cockpit/client";
import { Greeting } from "@/components/dashboard/greeting";
import { CalendarEvent } from "@/lib/types";
import { getUserProfile } from "@/lib/utils/user";
import { getTodayEvents, withGoogle } from "@/services/google";
import { createClient } from "@/services/supabase/server";

export default async function Home() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	const firstName = user ? getUserProfile(user).firstName : "";

	let events: CalendarEvent[] = [];
	let errorMsg: string | null = null;

	if (user) {
		const today = await withGoogle(user.id, "Google Calendar", getTodayEvents);
		events = today.data ?? [];
		errorMsg = today.error ?? null;
	}

	return (
		<main className="flex flex-1 flex-col gap-6">
			<header className="flex flex-col items-start justify-between space-y-2 sm:flex-row sm:items-center sm:space-y-0">
				<Greeting firstName={firstName} now={new Date().toISOString()} />
			</header>

			<CockpitClient initialEvents={events} initialError={errorMsg} />
		</main>
	);
}
