import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { EventCard } from "@/components/schedule/events/card";
import { typeLabel } from "@/components/schedule/events/type-labels";
import { dayCountLabel, type FeedSession, summarize } from "@/lib/domain/schedule/feed";
import { formatDay } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";

import { ArrowRight2, Calendar } from "iconsax-reactjs";

import { NewSessionButton } from "./new-session-button";

/** "09:00–10:00" on the studio's clock (as Google placed it), or "All day". */
const timeRange = (session: FeedSession) =>
	session.startTime && session.endTime ? `${session.startTime}–${session.endTime}` : "All day";

const row =
	"group focus-visible:ring-ring flex min-h-16 items-center gap-3 rounded-2xl border px-4 py-3 transition-colors outline-none focus-visible:ring-2";

/** A session that has ended (or an all-day event): when, what, who came; opens its history. */
export function SessionRow({ session, ended }: { session: FeedSession; ended: boolean }) {
	return (
		<Link href={`/check-in/${session.id}`} className={cn(row, "border-border/60 bg-card/70 hover:bg-card")}>
			<span className="w-23 shrink-0 self-start pt-0.5 text-sm text-muted-foreground tabular-nums">
				{timeRange(session)}
			</span>
			<span className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span className="truncate font-medium text-foreground">{session.title}</span>
				<span className="text-sm text-muted-foreground">
					{session.external ? "Calendar event" : typeLabel(session.type)}
					{session.checkIns ? (
						<>
							{" · "}
							<span className="font-semibold text-foreground tabular-nums">{session.checkIns}</span> came
						</>
					) : ended ? (
						" · No one came"
					) : null}
				</span>
			</span>
			<ArrowRight2 size={16} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
		</Link>
	);
}

/** A cancelled session stays in her history, with what it gave back. */
export function CancelledSessionRow({ session }: { session: FeedSession }) {
	return (
		<Link
			href={`/check-in/${session.id}`}
			className={cn(row, "border-dashed border-border/70 bg-card/50 hover:bg-card")}
		>
			<span className="w-23 shrink-0 self-start pt-0.5 text-sm text-muted-foreground tabular-nums line-through decoration-1">
				{timeRange(session)}
			</span>
			<span className="flex min-w-0 flex-1 flex-col gap-1">
				<span className="truncate font-medium text-muted-foreground">{session.title}</span>
				<span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
					<span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
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
			<ArrowRight2 size={16} className="shrink-0 text-muted-foreground" />
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
							<span className="text-sm text-muted-foreground">{formatDay(day, { day: "numeric", month: "long" })}</span>
							{isToday ? (
								<span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Today</span>
							) : null}
							<span className="ml-auto text-sm text-muted-foreground tabular-nums">
								{dayCountLabel(summarize(list))}
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
