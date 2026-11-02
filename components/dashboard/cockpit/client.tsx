import { EventCard } from "@/components/schedule/events/card";
import { NewSessionButton } from "@/components/schedule/new-session-button";
import { type FeedSession } from "@/lib/domain/schedule/feed";

/** Today's sessions, first on Home: the full cards, to check in or cancel. */
export function CockpitClient({
	sessions,
	error,
	bare = false,
}: {
	sessions: FeedSession[];
	error: string | null;
	/** Without the agenda bar, under a page heading that already says it. */
	bare?: boolean;
}) {
	// Cancelled sessions live in the week below; Today is what still happens.
	const today = sessions.filter((session) => session.status === "scheduled" && session.event);

	return (
		<div className="flex flex-col gap-5">
			{bare ? (
				!today.length && !error ? (
					<p className="text-muted-foreground rounded-3xl border border-dashed p-8 text-center">
						No class or private session today. They&apos;ll be here to check clients in.
					</p>
				) : null
			) : (
			<div className="bg-card zen-shadow flex items-center justify-between gap-4 rounded-3xl p-5">
				<div className="flex flex-col gap-0.5">
					<h2 className="font-heading text-foreground text-lg font-semibold tracking-tight">Today&apos;s agenda</h2>
					<span className="text-muted-foreground text-sm">
						{today.length
							? `${today.length} ${today.length === 1 ? "session" : "sessions"}`
							: "No sessions today. Enjoy the downtime."}
					</span>
				</div>
				<NewSessionButton />
			</div>
			)}

			{error ? (
				<p role="alert" className="bg-card zen-shadow rounded-2xl border p-5 text-sm leading-relaxed">
					{error}
				</p>
			) : today.length === 0 ? null : (
				<div className="flex flex-col gap-3">
					{today.map((session) => (
						<EventCard key={session.id} event={session.event!} checkIns={session.checkIns} />
					))}
				</div>
			)}
		</div>
	);
}
