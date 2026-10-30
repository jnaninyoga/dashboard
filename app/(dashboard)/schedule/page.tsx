import { NewSessionButton } from "@/components/schedule/new-session-button";
import { WeekList } from "@/components/schedule/week-list";
import { SESSION_TYPES, TypeFilter, WeekNav } from "@/components/schedule/week-nav";
import { getSessionFeed } from "@/lib/actions/schedule/feed";
import { type SessionType } from "@/lib/domain/schedule/feed";
import { addDays, studioDateString, weekDays, weekOf, weekStart } from "@/lib/utils/time";

export default async function SchedulePage({
	searchParams,
}: {
	searchParams: Promise<{ week?: string; type?: string }>;
}) {
	const params = await searchParams;
	const now = new Date();
	const today = studioDateString(now);
	const currentMonday = weekStart(today);
	const monday = weekOf(params.week, now);
	const days = weekDays(monday);
	const type = SESSION_TYPES.some((t) => t.value === params.type) ? (params.type as SessionType) : undefined;

	const feed = await getSessionFeed(days[0], days[6]);
	const sessions = (feed.data ?? []).filter((session) => !type || session.type === type);

	return (
		<>
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">Schedule</h1>
					<p className="text-muted-foreground">Every session, week by week: what&apos;s coming and who came.</p>
				</div>
				<NewSessionButton />
			</header>

			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<WeekNav monday={monday} currentMonday={currentMonday} type={type} />
				<TypeFilter monday={monday} currentMonday={currentMonday} type={type} />
			</div>

			{feed.error !== undefined ? (
				<p role="alert" className="bg-card zen-shadow rounded-2xl border p-5 text-sm leading-relaxed">
					{feed.error}
				</p>
			) : (
				<WeekList
					days={days}
					sessions={sessions}
					today={today}
					now={now}
					filtered={Boolean(type)}
					canAdd={addDays(monday, 6) >= today}
				/>
			)}
		</>
	);
}
