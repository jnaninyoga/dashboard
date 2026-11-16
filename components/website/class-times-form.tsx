"use client";

import { Fragment, useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveClassTimesAction } from "@/lib/actions/website";
import { addClass, inOrder, lengthOf, restsOf, setLength, setRest, setStart, showLength, toMinutes } from "@/lib/domain/website/day-chain";
import { type ClassTimes, classTimesProblems, normalizeClassTimes, showTime, timetableWords } from "@/lib/domain/website/timetable";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { notifyWebsite } from "@/lib/feedback/website";
import { type WorkingHoursConfig } from "@/lib/types";
import { cn } from "@/lib/utils/ui";

import { Add, CloseCircle, Global, Minus, Refresh, Warning2 } from "iconsax-reactjs";

/** The studio's week, Monday first. */
const WEEK = [
	{ day: 1, short: "Mon", label: "Monday" },
	{ day: 2, short: "Tue", label: "Tuesday" },
	{ day: 3, short: "Wed", label: "Wednesday" },
	{ day: 4, short: "Thu", label: "Thursday" },
	{ day: 5, short: "Fri", label: "Friday" },
	{ day: 6, short: "Sat", label: "Saturday" },
	{ day: 0, short: "Sun", label: "Sunday" },
];

/** Lengths and rests move by a quarter of an hour. */
const STEP = 15;

/** − value +, big enough for a thumb; the value (and what it means, under it) is read out when it changes. */
function Stepper({
	label,
	value,
	note,
	quiet,
	onLess,
	onMore,
	lessDisabled,
}: {
	label: string;
	value: string;
	note?: string;
	/** A rest: dashed and see-through, as the gaps are on the strip. */
	quiet?: boolean;
	onLess: () => void;
	onMore: () => void;
	lessDisabled?: boolean;
}) {
	return (
		<div role="group" aria-label={label} className={cn("inline-flex h-11 shrink-0 items-center rounded-full border", quiet ? "border-dashed" : "bg-background")}>
			<Button type="button" variant="ghost" size="icon" aria-label={`${label}: ${STEP} min less`} onClick={onLess} disabled={lessDisabled} className="size-11 rounded-full">
				<Minus size={18} />
			</Button>
			<span aria-live="polite" className="grid min-w-12 justify-items-center text-sm leading-tight font-semibold tabular-nums">
				{value}
				{note ? <span className="text-[0.6875rem] font-normal text-muted-foreground">{note}</span> : null}
			</span>
			<Button type="button" variant="ghost" size="icon" aria-label={`${label}: ${STEP} min more`} onClick={onMore} className="size-11 rounded-full">
				<Add size={18} />
			</Button>
		</div>
	);
}

/** The day at a glance: the classes as blocks, the rests as the gaps between them, the long breaks named. */
function DayStrip({ times }: { times: { start: string; end: string }[] }) {
	const real = times.filter((t) => lengthOf(t) > 0);
	if (!real.length) return null;
	const from = Math.floor(toMinutes(real[0].start) / 60) * 60;
	const to = Math.ceil(Math.max(...real.map((t) => toMinutes(t.end))) / 60) * 60;
	const span = Math.max(60, to - from);
	const at = (minutes: number) => `${((minutes - from) / span) * 100}%`;
	const rests = restsOf(real);
	return (
		<div aria-hidden className="grid gap-1.5 px-1 pt-1 pb-2">
			<div className="relative h-3 rounded-full bg-muted/70">
				{real.map((t, i) => (
					<span
						key={i}
						className="absolute inset-y-0 rounded-full bg-primary transition-[left,width] duration-300"
						style={{ left: at(toMinutes(t.start)), width: `calc(${at(toMinutes(t.end))} - ${at(toMinutes(t.start))} - 2px)` }}
					/>
				))}
			</div>
			<div className="relative h-4 text-xs text-muted-foreground tabular-nums">
				<span className="absolute left-0">{showTime(real[0].start)}</span>
				{rests.map((rest, i) =>
					rest >= 60 ? (
						<span key={i} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: at((toMinutes(real[i].end) + toMinutes(real[i + 1].start)) / 2) }}>
							{showLength(rest)} break
						</span>
					) : null,
				)}
				<span className="absolute right-0">{showTime(real.at(-1)!.end)}</span>
			</div>
		</div>
	);
}

/**
 * The website's class times: the days, then the times (the same each day),
 * and how the site will say them. Checked against the studio's hours as she
 * types; saving publishes them and rebuilds the site.
 */
export function ClassTimesForm({ initial, hours }: { initial: ClassTimes; hours: WorkingHoursConfig }) {
	const [saved, setSaved] = useState(() => JSON.stringify(normalizeClassTimes(initial)));
	// The times stay in order, so each one's rest is the gap to the next.
	const [draft, setDraft] = useState<ClassTimes>(() => ({ ...initial, times: inOrder(initial.times) }));
	const [pending, startTransition] = useTransition();

	const current = normalizeClassTimes(draft);
	const dirty = JSON.stringify(current) !== saved;
	const problems = useMemo(() => classTimesProblems(draft, hours), [draft, hours]);
	const words = timetableWords(draft);

	const toggleDay = (day: number) =>
		setDraft((d) => ({ ...d, days: d.days.includes(day) ? d.days.filter((x) => x !== day) : [...d.days, day] }));
	const change = (edit: (times: ClassTimes["times"]) => ClassTimes["times"]) => setDraft((d) => ({ ...d, times: inOrder(edit(d.times)) }));
	const removeTime = (index: number) => change((times) => times.filter((_, i) => i !== index));
	const rests = restsOf(draft.times);
	const nextRest = Math.max(0, rests.at(-1) ?? 30);

	const save = () =>
		startTransition(async () => {
			const result = await saveClassTimesAction(current);
			if (result.error) return void notifyActionError(result, "Couldn't save the class times");
			setSaved(JSON.stringify(current));
			setDraft(current);
			notify.success("Class times saved");
			notifyWebsite(result.website);
		});

	return (
		<div className="grid min-w-0 gap-8 *:min-w-0 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
			<div className="grid gap-8 *:min-w-0">
				<section aria-labelledby="days-title" className="grid gap-3">
					<h2 id="days-title" className="font-heading text-lg font-semibold">
						Days
					</h2>
					<div className="flex flex-wrap gap-2 rounded-3xl border border-secondary/20 bg-card p-4">
						{WEEK.map(({ day, short, label }) => {
							const on = draft.days.includes(day);
							return (
								<button
									key={day}
									type="button"
									aria-pressed={on}
									aria-label={label}
									onClick={() => toggleDay(day)}
									className={cn(
										"h-11 min-w-14 rounded-full px-4 font-semibold transition-colors active:scale-95",
										on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
									)}
								>
									{short}
								</button>
							);
						})}
					</div>
				</section>

				<section aria-labelledby="times-title" className="grid gap-3">
					<div className="flex min-h-10 items-center justify-between gap-3">
						<h2 id="times-title" className="font-heading text-lg font-semibold">
							Times, the same each day
						</h2>
						<span className="text-sm text-muted-foreground tabular-nums">
							{current.times.length} {current.times.length === 1 ? "class" : "classes"}
						</span>
					</div>
					<div className="@container min-w-0 rounded-3xl border border-secondary/20 bg-card p-3 sm:p-4">
						<DayStrip times={draft.times} />
						{draft.times.length ? (
							<ol className="grid">
								{draft.times.map((time, index) => {
									const rest = rests[index];
									return (
										<Fragment key={index}>
											<li className="grid grid-cols-[1fr_auto] items-center gap-1.5 py-1.5 @xs:flex">
												<Input
													type="time"
													aria-label={`Class ${index + 1} starts`}
													value={time.start}
													onChange={(e) => change((times) => setStart(times, index, e.target.value))}
													className="h-11 w-full px-2.5 tabular-nums @xs:w-32"
												/>
												<div className="row-start-2 @xs:row-start-auto">
													<Stepper
													label={`Class ${index + 1} length`}
													value={showLength(Math.max(0, lengthOf(time)))}
													note={`to ${showTime(time.end)}`}
													onLess={() => change((times) => setLength(times, index, lengthOf(time) - STEP))}
													onMore={() => change((times) => setLength(times, index, lengthOf(time) + STEP))}
													lessDisabled={lengthOf(time) <= STEP}
													/>
												</div>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													aria-label={`Remove the ${showTime(time.start)} class`}
													onClick={() => removeTime(index)}
													className="col-start-2 row-start-1 ml-auto size-11 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
												>
													<CloseCircle size={20} />
												</Button>
											</li>
											{rest === undefined ? null : (
												<li className="flex items-center gap-1.5 py-1">
													{/* Under the start time: the thread from one class to the next. */}
													<span aria-hidden className="flex w-6 justify-center @xs:w-32">
														<span className="h-9 border-l-2 border-dashed border-border" />
													</span>
													<Stepper
														quiet
														label={`Rest after class ${index + 1}`}
														value={rest < 0 ? "—" : showLength(rest)}
														onLess={() => change((times) => setRest(times, index, rest - STEP))}
														onMore={() => change((times) => setRest(times, index, Math.max(0, rest) + STEP))}
														lessDisabled={rest <= 0}
													/>
													<span className={cn("text-sm", rest < 0 ? "font-medium text-destructive" : "text-muted-foreground")}>
														{rest < 0 ? "overlaps" : rest === 0 ? "no rest" : rest >= 60 ? "break" : "rest"}
													</span>
												</li>
											)}
										</Fragment>
									);
								})}
							</ol>
						) : (
							<p className="px-3 py-6 text-center text-sm text-muted-foreground">No classes: the website says “by appointment”.</p>
						)}
						<Button type="button" variant="ghost" onClick={() => change(addClass)} className="mt-1 h-11 w-full rounded-2xl text-primary">
							<Add size={20} />
							{draft.times.length ? `Add a class after a ${showLength(nextRest)} rest` : "Add a class"}
						</Button>
					</div>
				</section>
			</div>

			<aside aria-labelledby="preview-title" className="grid gap-3 xl:sticky xl:top-20">
				<h2 id="preview-title" className="flex items-center gap-2 font-heading text-lg font-semibold">
					<Global size={20} variant="Bulk" className="text-primary" />
					On the website
				</h2>
				<div className="grid gap-4 rounded-3xl border border-primary/20 bg-primary/5 p-5">
					<div className="grid gap-1">
						<span className="text-xs font-medium text-muted-foreground">Français</span>
						<p className="font-heading text-2xl leading-tight font-semibold text-foreground">{words.fr.headline}</p>
					</div>
					<div className="grid gap-1">
						<span className="text-xs font-medium text-muted-foreground">English</span>
						<p className="font-heading text-xl leading-tight text-foreground">{words.en.headline}</p>
					</div>
					{current.times.length && current.days.length ? (
						<div className="flex flex-wrap gap-1.5">
							{current.times.map((t, i) => (
								<span key={i} className="rounded-full bg-card px-2.5 py-1 text-sm text-foreground tabular-nums">
									{showTime(t.start)}–{showTime(t.end)}
								</span>
							))}
						</div>
					) : null}
				</div>

				{problems.length ? (
					<ul className="grid gap-2 rounded-2xl bg-warning/10 p-4 text-sm text-foreground" role="alert">
						{problems.map((problem) => (
							<li key={problem} className="flex gap-2">
								<Warning2 size={18} variant="Bold" className="mt-0.5 shrink-0 text-warning" />
								{problem}
							</li>
						))}
					</ul>
				) : null}

				<Button onClick={save} disabled={!dirty || pending || problems.length > 0} className="h-12 rounded-2xl text-base font-semibold">
					{pending ? <Refresh className="mr-2 size-4 animate-spin" /> : null}
					{dirty ? "Save and update the website" : "Saved"}
				</Button>
				<p className="text-sm text-muted-foreground">The website shows the change about 2 minutes after you save.</p>
			</aside>
		</div>
	);
}
