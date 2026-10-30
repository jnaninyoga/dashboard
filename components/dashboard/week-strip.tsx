"use client";

import { useState } from "react";
import Link from "next/link";

import { CancelledSessionRow, SessionRow } from "@/components/schedule/week-list";
import { dayCountLabel, type FeedSession, summarize } from "@/lib/domain/schedule/feed";
import { formatDay } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";

import { ArrowRight2 } from "iconsax-reactjs";

/**
 * The week at a glance on Home: seven days with their sessions, today
 * marked; tapping a day lists its sessions underneath. The numbers are the
 * Schedule's own (same feed, same counting), and the week is measured by
 * the clients who came.
 */
export function WeekStrip({
	days,
	sessions,
	today,
	now,
}: {
	days: string[];
	sessions: FeedSession[];
	today: string;
	/** ISO; from the server, so both renders agree on what's over. */
	now: string;
}) {
	const byDay = new Map(days.map((day) => [day, sessions.filter((session) => session.day === day)]));
	// Today's sessions are in the agenda above; on a quiet day the strip
	// opens on the next day that has some, which says something new.
	const [selected, setSelected] = useState(() => {
		if (!days.includes(today) || byDay.get(today)?.length) return days.includes(today) ? today : days[0];
		return days.find((day) => day > today && byDay.get(day)?.length) ?? today;
	});
	const week = summarize(sessions);
	const chosen = byDay.get(selected) ?? [];

	return (
		<section aria-labelledby="this-week" className="bg-card border-secondary/20 flex flex-col gap-5 rounded-3xl border p-5 sm:p-6">
			<div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
				<div className="flex flex-col gap-1">
					<h2 id="this-week" className="font-heading text-foreground text-xl font-semibold">
						This week
					</h2>
					<p className="text-muted-foreground text-sm">
						{week.sessions
							? `${week.sessions} ${week.sessions === 1 ? "session" : "sessions"} this week, ${week.checkIns} ${week.checkIns === 1 ? "check-in" : "check-ins"} so far`
							: "No sessions this week"}
						{week.cancelled ? `, ${week.cancelled} cancelled` : ""}
					</p>
				</div>
				<Link
					href="/schedule"
					className="text-primary focus-visible:ring-ring -mr-2 inline-flex min-h-10 items-center gap-1 rounded-full px-2 text-sm font-semibold outline-none hover:underline focus-visible:ring-2"
				>
					Open the full schedule
					<ArrowRight2 size={16} />
				</Link>
			</div>

			<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
			<div role="group" aria-label="Days of this week" className="grid grid-cols-7 gap-1.5 lg:w-[30rem] lg:shrink-0">
				{days.map((day) => {
					const { sessions: count, cancelled } = summarize(byDay.get(day) ?? []);
					const isSelected = day === selected;
					const isToday = day === today;
					return (
						<button
							key={day}
							type="button"
							onClick={() => setSelected(day)}
							aria-pressed={isSelected}
							aria-label={`${formatDay(day, { weekday: "long", day: "numeric", month: "long" })}: ${dayCountLabel({ sessions: count, cancelled })}`}
							className={cn(
								"focus-visible:ring-ring flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl transition-colors outline-none focus-visible:ring-2 active:scale-95 motion-reduce:transition-none",
								isSelected
									? "bg-primary text-primary-foreground"
									: isToday
										? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
										: "hover:bg-muted/70",
								!isSelected && day < today && "text-muted-foreground",
							)}
						>
							<span className={cn("text-xs", isSelected ? "opacity-90" : "text-muted-foreground")}>
								{formatDay(day, { weekday: "short" })}
							</span>
							<span className="text-lg leading-none font-semibold tabular-nums">{formatDay(day, { day: "numeric" })}</span>
							{/* The day's number of sessions, in a pill so it never reads as part of the date. */}
							<span
								aria-hidden
								className={cn(
									"flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums",
									count === 0 && "invisible",
									isSelected ? "bg-primary-foreground/20" : "bg-primary/10 text-primary",
								)}
							>
								{count}
							</span>
						</button>
					);
				})}
			</div>

			<div className="flex min-w-0 flex-1 flex-col gap-3">
				<p className="flex items-baseline justify-between gap-3">
					<span className="font-heading text-foreground text-lg font-semibold">
						{selected === today ? "Today" : formatDay(selected, { weekday: "long", day: "numeric", month: "long" })}
					</span>
					<span className="text-muted-foreground text-sm">{dayCountLabel(summarize(chosen))}</span>
				</p>
				{/* An empty day says so in its heading ("No sessions"); nothing more to add. */}
				{chosen.length ? (
					chosen.map((session) =>
						session.status === "cancelled" ? (
							<CancelledSessionRow key={session.id} session={session} />
						) : (
							<SessionRow key={session.id} session={session} ended={new Date(session.end) < new Date(now)} />
						),
					)
				) : null}
			</div>
			</div>
		</section>
	);
}
