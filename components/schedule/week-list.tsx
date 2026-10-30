import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { EventCard, TYPE_META } from "@/components/schedule/events/card";
import { type FeedSession } from "@/lib/domain/schedule/feed";
import { formatDay, toStudioTime } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";

import { format } from "date-fns";
import { ArrowRight2, Calendar } from "iconsax-reactjs";

import { NewSessionButton } from "./new-session-button";

/** "09:00–10:00" on the studio's clock, or "All day" for a Google all-day event. */
const timeRange = (session: FeedSession) =>
	session.event && !session.event.start?.dateTime
		? "All day"
		: `${format(toStudioTime(new Date(session.start)), "HH:mm")}–${format(toStudioTime(new Date(session.end)), "HH:mm")}`;

const row =
	"group focus-visible:ring-ring flex min-h-16 items-center gap-3 rounded-2xl border px-4 py-3 transition-colors outline-none focus-visible:ring-2";

/** A session that has ended (or an all-day event): when, what, who came; opens its history. */
function SessionRow({ session, ended }: { session: FeedSession; ended: boolean }) {
	return (
		<Link href={`/check-in/${session.id}`} className={cn(row, "bg-card/70 border-border/60 hover:bg-card")}>
			<span className="text-muted-foreground w-[5.75rem] shrink-0 self-start pt-0.5 text-sm tabular-nums">
				{timeRange(session)}
			</span>
			<span className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span className="text-foreground truncate font-medium">{session.title}</span>
				<span className="text-muted-foreground text-sm">
					{TYPE_META[session.type].label}
					{session.checkIns ? (
						<>
							{" · "}
							<span className="text-foreground font-semibold tabular-nums">{session.checkIns}</span> came
						</>
					) : ended ? (
						" · No one came"
					) : null}
				</span>
			</span>
			<ArrowRight2 size={16} className="text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
		</Link>
	);
}

/** A cancelled session stays in her history, with what it gave back. */
function CancelledSessionRow({ session }: { session: FeedSession }) {
	return (
		<Link
			href={`/check-in/${session.id}`}
			className={cn(row, "bg-card/50 border-border/70 hover:bg-card border-dashed")}
		>
			<span className="text-muted-foreground w-[5.75rem] shrink-0 self-start pt-0.5 text-sm tabular-nums line-through decoration-1">
				{timeRange(session)}
			</span>
			<span className="flex min-w-0 flex-1 flex-col gap-1">
				<span className="text-muted-foreground truncate font-medium">{session.title}</span>
				<span className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
					<span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-xs font-semibold">
						Cancelled
					</span>
					{/* One run of text, so a wrapped line never starts with its separator. */}
					{session.cancelReason || session.refunded ? (
						<span>
							{[
								session.cancelReason,
								session.refunded
									? `${session.refunded} ${session.refunded === 1 ? "credit" : "credits"} given back`
									: null,
							]
								.filter(Boolean)
								.join(" · ")}
						</span>
					) : null}
				</span>
			</span>
			<ArrowRight2 size={16} className="text-muted-foreground shrink-0" />
		</Link>
	);
}

/**
 * The week, day by day, Monday to Sunday. What's ahead keeps its full card
 * (check-in, guests, cancel); what's over is a quiet row that opens its
 * history, so today is never far down the page.
 */
export function WeekList({
	days,
	sessions,
	today,
	now,
	filtered,
	canAdd,
}: {
	days: string[];
	sessions: FeedSession[];
	today: string;
	now: Date;
	/** A type filter is on (changes what "empty" says). */
	filtered: boolean;
	/** New sessions belong in this week (it isn't over). */
	canAdd: boolean;
}) {
	if (!sessions.length) {
		return (
			<EmptyState
				icon={<Calendar size={40} variant="Bulk" />}
				title={filtered ? "No sessions of this kind this week" : "No sessions this week"}
				description={
					canAdd
						? "Add one, or look at another week."
						: "Nothing was on the calendar that week."
				}
				action={canAdd ? <NewSessionButton /> : undefined}
			/>
		);
	}

	const byDay = new Map<string, FeedSession[]>();
	for (const session of sessions) byDay.set(session.day, [...(byDay.get(session.day) ?? []), session]);

	return (
		<div className="flex flex-col gap-6">
			{days.map((day) => {
				const list = byDay.get(day) ?? [];
				const isToday = day === today;
				const isPast = day < today;
				return (
					<section key={day} aria-labelledby={`day-${day}`} className="flex flex-col gap-3">
						<h2 id={`day-${day}`} className="flex items-center gap-2.5">
							<span
								className={cn(
									"font-heading text-xl font-semibold",
									isPast ? "text-muted-foreground" : "text-foreground",
								)}
							>
								{formatDay(day, { weekday: "long" })}
							</span>
							<span className="text-muted-foreground text-sm">{formatDay(day, { day: "numeric", month: "long" })}</span>
							{isToday ? (
								<span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">Today</span>
							) : null}
							<span className="text-muted-foreground ml-auto text-sm tabular-nums">
								{list.length ? `${list.length} ${list.length === 1 ? "session" : "sessions"}` : "No sessions"}
							</span>
						</h2>
						{list.length === 0 ? null : (
							list.map((session) => {
								if (session.status === "cancelled") {
									return <CancelledSessionRow key={session.id} session={session} />;
								}
								const ended = new Date(session.end) < now;
								// The full card is for what's ahead, at a set time.
								return ended || !session.event?.start?.dateTime ? (
									<SessionRow key={session.id} session={session} ended={ended} />
								) : (
									<EventCard key={session.id} event={session.event} checkIns={session.checkIns} />
								);
							})
						)}
					</section>
				);
			})}
		</div>
	);
}
