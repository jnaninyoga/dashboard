"use client";

import { Fragment, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { setWorkingHours } from "@/lib/actions/settings";
import { DAYS } from "@/lib/config/schedule";
import { addPeriod, inOrder, lengthOf, restsOf, setLength, setRest, setStart, showLength, showTime, toMinutes } from "@/lib/domain/schedule/day-chain";
import { type DayHours, type Period, weekProblems, type WorkingHoursConfig } from "@/lib/domain/schedule/hours";
import { siteHours } from "@/lib/domain/website/timetable";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { notifyWebsite } from "@/lib/feedback/website";
import { cn } from "@/lib/utils/ui";

import { Add, ArrowDown2, CloseCircle, Global, Refresh, TickCircle } from "iconsax-reactjs";

import { STEP, Stepper } from "./stepper";

const SHORT = { "1": "Mon", "2": "Tue", "3": "Wed", "4": "Thu", "5": "Fri", "6": "Sat", "0": "Sun" } as Record<string, string>;

const sameHours = (a: DayHours, b: DayHours) => a.isOpen && b.isOpen && JSON.stringify(inOrder(a.periods)) === JSON.stringify(inOrder(b.periods));
const summary = (day: DayHours) => {
	if (!day.isOpen) return "Closed";
	if (!day.periods.length) return "No periods yet";
	const n = day.periods.length;
	return `${showTime(day.periods[0].start)}–${showTime(day.periods.at(-1)!.end)} · ${n} ${n === 1 ? "period" : "periods"}`;
};

/**
 * Studio hours: each day closed, or the periods she works with the rests
 * between them. Saving is one tap that does both jobs: sessions are scheduled
 * inside these hours from then on, and the website rebuilds to show them.
 */
export function ScheduleForm({ initial }: { initial: WorkingHoursConfig }) {
	const [saved, setSaved] = useState(() => JSON.stringify(initial));
	const [week, setWeek] = useState<WorkingHoursConfig>(initial);
	const [editing, setEditing] = useState<string | null>(null);
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

	const setDay = (key: string, day: DayHours) => setWeek((w) => ({ ...w, [key]: { ...day, periods: inOrder(day.periods) } }));
	const editPeriods = (key: string, edit: (periods: Period[]) => Period[]) =>
		setWeek((w) => ({ ...w, [key]: { ...w[key], periods: inOrder(edit(w[key].periods)) } }));

	const save = () =>
		startTransition(async () => {
			const result = await setWorkingHours(week);
			if (result.error) return void notifyActionError(result, "Couldn't save the hours");
			setSaved(JSON.stringify(week));
			notify.success("Studio hours saved");
			notifyWebsite(result.website);
		});

	// The axis spans the open hours, at least 6:00 to 22:00, marked every 4 hours.
	const open = DAYS.map((d) => week[d.key]).filter((d) => d.isOpen && d.periods.length);
	const from = Math.min(6, ...open.map((d) => Math.floor(toMinutes(d.periods[0].start) / 240) * 4));
	const to = Math.max(22, ...open.map((d) => Math.ceil(toMinutes(d.periods.at(-1)!.end) / 240) * 4));
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
					{/* The time axis, above the bars (wide screens only: on a phone each day says its hours). */}
					<div className="hidden px-4 pt-3 @xl/week:grid @xl/week:grid-cols-[10rem_1fr_12.5rem] @xl/week:gap-4">
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
						<span />
					</div>

					<ul className="divide-y divide-border">
						{DAYS.map(({ key, label }) => {
							const day = week[key];
							const problem = problems[key];
							const isEditing = editing === key && day.isOpen;
							const panel = `hours-${key}-periods`;
							return (
								<li key={key} className="grid gap-3 px-4 py-3">
									<div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 @xl/week:grid-cols-[10rem_1fr_12.5rem] @xl/week:gap-x-4">
										<div className="flex items-center gap-3">
											<Switch
												checked={day.isOpen}
												onCheckedChange={(isOpen) => {
													setDay(key, { isOpen, periods: isOpen && !day.periods.length ? [{ start: "09:00", end: "10:30" }] : day.periods });
													if (isOpen) setEditing(key);
												}}
												aria-label={`${label} open`}
											/>
											<span className={cn("font-medium", !day.isOpen && "text-muted-foreground")}>{label}</span>
										</div>

										{/* The day on the week's axis: the periods, and the rests between them. */}
										<div
											aria-hidden
											className={cn(
												"relative order-last col-span-3 h-2.5 rounded-full @xl/week:order-0 @xl/week:col-span-1",
												day.isOpen ? "bg-muted/70" : "hidden @xl/week:block",
											)}
										>
											{day.isOpen
												? day.periods
														.filter((p) => lengthOf(p) > 0)
														.map((p) => (
															<span
																key={p.start}
																className="absolute inset-y-0 rounded-full bg-primary transition-[left,width] duration-300"
																style={{ left: at(p.start), width: `calc(${at(p.end)} - ${at(p.start)} - 2px)` }}
															/>
														))
												: null}
										</div>

										{day.isOpen ? (
											<button
												type="button"
												aria-expanded={isEditing}
												aria-controls={panel}
												onClick={() => setEditing(isEditing ? null : key)}
												className="col-start-3 row-start-1 flex min-h-11 min-w-0 items-center justify-end gap-1.5 rounded-full px-2 text-right text-sm text-muted-foreground tabular-nums hover:text-foreground @xl/week:col-start-auto @xl/week:row-start-auto"
											>
												<span className={cn("min-w-0 @xl/week:whitespace-nowrap", problem && "text-destructive")}>{summary(day)}</span>
												<ArrowDown2 size={16} className={cn("shrink-0 transition-transform", isEditing && "rotate-180")} />
											</button>
										) : (
											<span className="col-start-3 row-start-1 text-right text-sm text-muted-foreground @xl/week:col-start-auto @xl/week:row-start-auto">Closed</span>
										)}
									</div>

									{problem ? <p className="text-sm text-destructive">{problem}</p> : null}

									{isEditing ? (
										<DayPeriods
											id={panel}
											dayKey={key}
											label={label}
											day={day}
											week={week}
											onPeriods={(edit) => editPeriods(key, edit)}
											onCopy={(target) => setDay(target, { isOpen: true, periods: day.periods.map((p) => ({ ...p })) })}
										/>
									) : null}
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

/** One day's periods and the rests between them, and copying them to other days. */
function DayPeriods({
	id,
	dayKey,
	label,
	day,
	week,
	onPeriods,
	onCopy,
}: {
	id: string;
	dayKey: string;
	label: string;
	day: DayHours;
	week: WorkingHoursConfig;
	onPeriods: (edit: (periods: Period[]) => Period[]) => void;
	onCopy: (target: string) => void;
}) {
	const periods = day.periods;
	const rests = restsOf(periods);
	const nextRest = Math.max(0, rests.at(-1) ?? 30);
	return (
		<div id={id} className="@container grid gap-3 rounded-2xl bg-muted/40 p-3">
			<ol className="grid">
				{periods.map((period, index) => {
					const rest = rests[index];
					const length = lengthOf(period);
					return (
						<Fragment key={index}>
							<li className="grid grid-cols-[1fr_auto] items-center gap-1.5 py-1.5 @xs:flex">
								<Input
									type="time"
									aria-label={`${label}, period ${index + 1} starts`}
									value={period.start}
									onChange={(e) => onPeriods((p) => setStart(p, index, e.target.value))}
									className="h-11 w-full bg-background px-2.5 tabular-nums @xs:w-32"
								/>
								<div className="row-start-2 @xs:row-start-auto">
									<Stepper
										label={`${label}, period ${index + 1} length`}
										value={showLength(Math.max(0, length))}
										note={`to ${showTime(period.end)}`}
										onLess={() => onPeriods((p) => setLength(p, index, length - STEP))}
										onMore={() => onPeriods((p) => setLength(p, index, length + STEP))}
										lessDisabled={length <= STEP}
									/>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									aria-label={`Remove the ${showTime(period.start)} period`}
									onClick={() => onPeriods((p) => p.filter((_, i) => i !== index))}
									className="col-start-2 row-start-1 ml-auto size-11 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
								>
									<CloseCircle size={20} />
								</Button>
							</li>
							{rest === undefined ? null : (
								<li className="flex items-center gap-1.5 py-1">
									{/* Under the start time: the thread from one period to the next. */}
									<span aria-hidden className="flex w-6 justify-center @xs:w-32">
										<span className="h-9 border-l-2 border-dashed border-border" />
									</span>
									<Stepper
										quiet
										label={`${label}, rest after period ${index + 1}`}
										value={rest < 0 ? "—" : showLength(rest)}
										onLess={() => onPeriods((p) => setRest(p, index, rest - STEP))}
										onMore={() => onPeriods((p) => setRest(p, index, Math.max(0, rest) + STEP))}
										lessDisabled={rest <= 0}
									/>
									<span className={cn("text-sm", rest < 0 ? "font-medium text-destructive" : "text-muted-foreground")}>
										{rest < 0 ? "overlaps" : rest === 0 ? "no rest" : "rest"}
									</span>
								</li>
							)}
						</Fragment>
					);
				})}
			</ol>
			<Button type="button" variant="ghost" onClick={() => onPeriods(addPeriod)} className="h-11 w-full rounded-2xl text-primary">
				<Add size={20} />
				{periods.length ? `Add a period after a ${showLength(nextRest)} rest` : "Add a period"}
			</Button>

			{periods.length ? (
				<div className="grid gap-2">
					<span className="text-sm font-medium">Same hours on</span>
					<div className="flex flex-wrap gap-2">
						{DAYS.filter((d) => d.key !== dayKey).map(({ key, label: other }) => {
							const same = sameHours(day, week[key]);
							return (
								<button
									key={key}
									type="button"
									aria-pressed={same}
									aria-label={same ? `${other} has the same hours` : `Give ${other} the same hours`}
									onClick={() => (same ? undefined : onCopy(key))}
									className={cn(
										"inline-flex h-10 min-w-14 items-center justify-center gap-1 rounded-full px-3 text-sm font-semibold transition-colors active:scale-95",
										same ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground",
									)}
								>
									{same ? <TickCircle size={16} variant="Bold" /> : null}
									{SHORT[key]}
								</button>
							);
						})}
					</div>
				</div>
			) : null}
		</div>
	);
}
