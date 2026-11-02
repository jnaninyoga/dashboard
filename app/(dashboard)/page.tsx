import { CockpitClient } from "@/components/dashboard/cockpit/client";
import { Greeting } from "@/components/dashboard/greeting";
import { Renewals } from "@/components/dashboard/renewals";
import { WeekStrip } from "@/components/dashboard/week-strip";
import { getRenewalsDue } from "@/lib/actions/clients/renewals";
import { getSessionFeed } from "@/lib/actions/schedule/feed";
import { requireUser } from "@/lib/auth/require-user";
import { studioDateString, weekDays, weekStart } from "@/lib/utils/time";
import { getUserProfile } from "@/lib/utils/user";

export default async function Home() {
	const user = await requireUser();
	const firstName = getUserProfile(user).firstName;

	// One Google Calendar request feeds both today's agenda and the week.
	const now = new Date();
	const today = studioDateString(now);
	const days = weekDays(weekStart(today));
	const [week, renewals] = await Promise.all([getSessionFeed(days[0], days[6]), getRenewalsDue()]);
	const sessions = week.data ?? [];

	return (
		<div className="flex flex-1 flex-col gap-6">
			<header className="flex flex-col items-start justify-between space-y-2 sm:flex-row sm:items-center sm:space-y-0">
				<Greeting firstName={firstName} now={now.toISOString()} />
			</header>

			<CockpitClient sessions={sessions.filter((session) => session.day === today)} error={week.error ?? null} />

			<Renewals due={renewals.data ?? []} error={renewals.error} today={today} signature={firstName || "Jnanin Yoga"} />

			{week.error === undefined ? (
				<WeekStrip days={days} sessions={sessions} today={today} now={now.toISOString()} />
			) : null}
		</div>
	);
}
