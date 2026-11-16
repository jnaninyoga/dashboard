"use client";

import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { setWorkingHours } from "@/lib/actions/settings";
import { DAYS } from "@/lib/config/schedule";
import { addPeriod, inOrder, lengthOf, showLength, showTime, toMinutes } from "@/lib/domain/schedule/day-chain";
import { type DayHours, type Period, weekProblems, type WorkingHoursConfig } from "@/lib/domain/schedule/hours";
import { siteHours } from "@/lib/domain/website/timetable";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { notifyWebsite } from "@/lib/feedback/website";
import { cn } from "@/lib/utils/ui";

import { Add, CloseCircle, Copy, Global, Refresh, TickCircle } from "iconsax-reactjs";

/** A day opened for the first time starts with the usual working day. */
const NEW_DAY: Period[] = [{ start: "09:00", end: "18:00" }];

const sameHours = (a: DayHours, b: DayHours) => a.isOpen && b.isOpen && JSON.stringify(inOrder(a.periods)) === JSON.stringify(inOrder(b.periods));

/**
 * Studio hours, the way opening hours are set everywhere: each day open or
 * closed, its hours as "08:30 – 10:00" pairs, more pairs for a split day (the
 * rests are the gaps between them), and copying a day to others. One button
 * saves them for scheduling and rebuilds the website to show them.
 */
export function ScheduleForm({ initial }: { initial: WorkingHoursConfig }) {
	const [saved, setSaved] = useState(() => JSON.stringify(initial));
	const [week, setWeek] = useState<WorkingHoursConfig>(initial);
	const [pending, startTransition] = useTransition();

	const dirty = JSON.stringify(week) !== saved;
	const problems = weekProblems(week);
	const blocked = Object.keys(problems).length > 0;
	const site = siteHours(week);

	// Leaving with changes that aren't saved asks first.
	useEffect(() => {
		if (!dirty) return;
		const warn = (event: BeforeUnloadEvent) => event.preventDefault();
		window.addEventListener("beforeunload", warn);
		return () => window.removeEventListener("beforeunload", warn);
	}, [dirty]);

	const setDay = (key: string, day: DayHours) => setWeek((w) => ({ ...w, [key]: day }));
	// Pairs keep the order she sees while she types; they're sorted when checked and saved.
	const setPeriods = (key: string, periods: Period[]) => setDay(key, periods.length ? { isOpen: true, periods } : { isOpen: false, periods: [] });

	const save = () =>
		startTransition(async () => {
			const result = await setWorkingHours(week);
			if (result.error) return void notifyActionError(result, "Couldn't save the hours");
			setSaved(JSON.stringify(week));
			notify.success("Studio hours saved");
			notifyWebsite(result.website);
		});

	// One time axis for every day's bar: the open hours, at least 6:00 to 22:00.
	const open = DAYS.map((d) => week[d.key]).filter((d) => d.isOpen && d.periods.length);
	const starts = open.flatMap((d) => d.periods.map((p) => toMinutes(p.start)));
	const ends = open.flatMap((d) => d.periods.map((p) => toMinutes(p.end)));
	const from = Math.min(6, ...starts.map((m) => Math.floor(m / 240) * 4));
	const to = Math.max(22, ...ends.map((m) => Math.ceil(m / 240) * 4));
	const span = (to - from) * 60;
	const ticks = Array.from({ length: (to - from) / 4 + 1 }, (_, i) => from + i * 4);
	const at = (time: string) => `${((toMinutes(time) - from * 60) / span) * 100}%`;
	const minutesOpen = open.reduce((sum, d) => sum + d.periods.reduce((m, p) => m + Math.max(0, lengthOf(p)), 0), 0);

	return (
		<div className="@container/hours grid min-w-0 gap-8 *:min-w-0 @5xl/hours:grid-cols-[minmax(0,1fr)_22rem] @5xl/hours:items-start">
			<section aria-labelledby="week-title" className="grid gap-3">
				<h2 id="week-title" className="font-heading text-lg font-semibold">
					Open {open.length} {open.length === 1 ? "day" : "days"}, {showLength(minutesOpen)} a week
				</h2>

				<div className="@container/week rounded-2xl border bg-card">
					{/* The time axis, over the bars (wide only: on a phone each day lists its hours). */}
					<div className="hidden px-4 pt-3 @2xl/week:grid @2xl/week:grid-cols-[9rem_1fr] @2xl/week:gap-x-6">
						<span />
						<div className="@container relative h-4 text-xs text-muted-foreground tabular-nums">
							{ticks.map((hour, i) => (
								<span
									key={hour}
									// The ends sit inside the axis; the hours between are centred on their mark, when there's room.
									className={cn("absolute", i === 0 ? "" : i === ticks.length - 1 ? "-translate-x-full" : "hidden -translate-x-1/2 @xs:block")}
									style={{ left: `${(((hour - from) * 60) / span) * 100}%` }}
								>
									{String(hour).padStart(2, "0")}:00
								</span>
							))}
						</div>
					</div>

					<ul className="divide-y divide-border">
						{DAYS.map(({ key, label }) => {
							const day = week[key];
							const problem = problems[key];
							return (
								<li key={key} className="grid gap-3 px-4 py-3.5 @2xl/week:grid-cols-[9rem_1fr] @2xl/week:gap-x-6">
									<div className="flex h-10 items-center gap-3">
										<Switch
											checked={day.isOpen}
											onCheckedChange={(isOpen) => setDay(key, isOpen ? { isOpen, periods: day.periods.length ? day.periods : NEW_DAY } : { ...day, isOpen })}
											aria-label={`${label} open`}
										/>
										<span className={cn("font-medium", !day.isOpen && "text-muted-foreground")}>{label}</span>
										{day.isOpen ? null : <span className="ml-auto text-sm text-muted-foreground @2xl/week:hidden">Closed</span>}
									</div>

									{day.isOpen ? (
										<div className="grid min-w-0 gap-2.5">
											{/* The day on the week's axis: its hours, the rests as gaps. */}
											<div aria-hidden className="relative mt-1 h-2.5 rounded-full bg-muted/70">
												{day.periods
													.filter((p) => lengthOf(p) > 0)
													.map((p, i) => (
														<span
															key={i}
															className="absolute inset-y-0 rounded-full bg-primary transition-[left,width] duration-300"
															style={{ left: at(p.start), width: `calc(${at(p.end)} - ${at(p.start)} - 2px)` }}
														/>
													))}
											</div>

											<ul className="grid grid-cols-[repeat(auto-fill,minmax(15.5rem,1fr))] gap-2">
												{day.periods.map((period, index) => (
													<li key={index} className="flex min-w-0 items-center gap-1.5">
														<Input
															type="time"
															aria-label={`${label}, opens`}
															value={period.start}
															onChange={(e) => setPeriods(key, day.periods.map((p, i) => (i === index ? { ...p, start: e.target.value || p.start } : p)))}
															className="h-10 w-0 min-w-0 flex-1 px-2 text-sm tabular-nums [&::-webkit-calendar-picker-indicator]:hidden"
														/>
														<span aria-hidden className="text-muted-foreground">
															–
														</span>
														<Input
															type="time"
															aria-label={`${label}, closes`}
															value={period.end}
															onChange={(e) => setPeriods(key, day.periods.map((p, i) => (i === index ? { ...p, end: e.target.value || p.end } : p)))}
															className="h-10 w-0 min-w-0 flex-1 px-2 text-sm tabular-nums [&::-webkit-calendar-picker-indicator]:hidden"
														/>
														<Button
															type="button"
															variant="ghost"
															size="icon"
															aria-label={`Remove ${label} ${showTime(period.start)}–${showTime(period.end)}`}
															onClick={() => setPeriods(key, day.periods.filter((_, i) => i !== index))}
															className="size-10 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
														>
															<CloseCircle size={18} />
														</Button>
													</li>
												))}
											</ul>

											{problem ? <p className="text-sm text-destructive">{problem}</p> : null}

											<div className="flex flex-wrap items-center gap-1">
												<Button type="button" variant="ghost" size="sm" onClick={() => setPeriods(key, addPeriod(inOrder(day.periods)))} className="h-10 rounded-full text-primary">
													<Add size={18} />
													Add hours
												</Button>
												<CopyTo dayKey={key} label={label} week={week} onCopy={(target) => setDay(target, { isOpen: true, periods: day.periods.map((p) => ({ ...p })) })} />
											</div>
										</div>
									) : (
										<p className="hidden h-10 items-center text-sm text-muted-foreground @2xl/week:flex">Closed</p>
									)}
								</li>
							);
						})}
					</ul>
				</div>
			</section>

			<aside aria-labelledby="site-title" className="grid gap-3 @5xl/hours:sticky @5xl/hours:top-20">
				<h2 id="site-title" className="flex items-center gap-2 font-heading text-lg font-semibold">
					<Global size={20} variant="Bulk" className="text-primary" />
					On the website
				</h2>
				<div className="grid gap-4 rounded-3xl border border-primary/20 bg-primary/5 p-5">
					<div className="grid gap-1">
						<span className="text-xs font-medium text-muted-foreground">Français</span>
						<p className="font-heading text-2xl leading-tight font-semibold text-foreground">{site.words.fr.headline}</p>
					</div>
					<div className="grid gap-1">
						<span className="text-xs font-medium text-muted-foreground">English</span>
						<p className="font-heading text-xl leading-tight text-foreground">{site.words.en.headline}</p>
					</div>
					{site.groups.map((g) => (
						<div key={g.days.join()} className="grid gap-1.5">
							<span className="text-sm font-medium text-foreground first-letter:uppercase">{g.words.fr.daysAnd}</span>
							<div className="flex flex-wrap gap-1.5">
								{g.periods.map((p) => (
									<span key={p.start} className="rounded-full bg-card px-2.5 py-1 text-sm text-foreground tabular-nums">
										{showTime(p.start)}–{showTime(p.end)}
									</span>
								))}
							</div>
						</div>
					))}
				</div>

				<Button onClick={save} disabled={!dirty || pending || blocked} className="h-12 rounded-2xl text-base font-semibold">
					{pending ? <Refresh className="mr-2 size-4 animate-spin" /> : null}
					{dirty ? "Save and update the website" : "Saved"}
				</Button>
				<p className="text-sm text-muted-foreground">
					{blocked
						? "Fix the days marked in red first."
						: "Group and private sessions are scheduled inside these hours. The website shows them about 2 minutes after you save."}
				</p>
			</aside>
		</div>
	);
}

/** "Copy to…": the same hours on another day, which opens it. Days that already match are ticked. */
function CopyTo({ dayKey, label, week, onCopy }: { dayKey: string; label: string; week: WorkingHoursConfig; onCopy: (target: string) => void }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button type="button" variant="ghost" size="sm" className="h-10 rounded-full text-muted-foreground">
					<Copy size={16} />
					Copy to…
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="min-w-48">
				<DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{label}&apos;s hours on</DropdownMenuLabel>
				{DAYS.filter((d) => d.key !== dayKey).map((d) => {
					const same = sameHours(week[dayKey], week[d.key]);
					return (
						<DropdownMenuItem key={d.key} disabled={same} onSelect={() => onCopy(d.key)} className="justify-between">
							{d.label}
							{same ? <TickCircle size={16} variant="Bold" className="text-primary" /> : null}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
