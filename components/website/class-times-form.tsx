"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveClassTimesAction } from "@/lib/actions/website";
import { type ClassTimes, classTimesProblems, normalizeClassTimes, showTime, timetableWords } from "@/lib/domain/website/timetable";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { notifyWebsite } from "@/lib/feedback/website";
import { type WorkingHoursConfig } from "@/lib/types";
import { cn } from "@/lib/utils/ui";

import { Add, CloseCircle, Global, Refresh, Warning2 } from "iconsax-reactjs";

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

const addMinutes = (time: string, add: number) => {
	const [h, m] = time.split(":").map(Number);
	const total = Math.min(h * 60 + m + add, 23 * 60);
	return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

/**
 * The website's class times: the days, then the times (the same each day),
 * and how the site will say them. Checked against the studio's hours as she
 * types; saving publishes them and rebuilds the site.
 */
export function ClassTimesForm({ initial, hours }: { initial: ClassTimes; hours: WorkingHoursConfig }) {
	const [saved, setSaved] = useState(() => JSON.stringify(normalizeClassTimes(initial)));
	const [draft, setDraft] = useState<ClassTimes>(initial);
	const [pending, startTransition] = useTransition();

	const current = normalizeClassTimes(draft);
	const dirty = JSON.stringify(current) !== saved;
	const problems = useMemo(() => classTimesProblems(draft, hours), [draft, hours]);
	const words = timetableWords(draft);

	const toggleDay = (day: number) =>
		setDraft((d) => ({ ...d, days: d.days.includes(day) ? d.days.filter((x) => x !== day) : [...d.days, day] }));
	const setTime = (index: number, patch: Partial<ClassTimes["times"][number]>) =>
		setDraft((d) => ({ ...d, times: d.times.map((t, i) => (i === index ? { ...t, ...patch } : t)) }));
	const removeTime = (index: number) => setDraft((d) => ({ ...d, times: d.times.filter((_, i) => i !== index) }));
	const addTime = () =>
		setDraft((d) => {
			const last = normalizeClassTimes(d).times.at(-1);
			const start = last ? addMinutes(last.end, 30) : "09:00";
			return { ...d, times: [...d.times, { start, end: addMinutes(start, 90) }] };
		});

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
					<div className="min-w-0 rounded-3xl border border-secondary/20 bg-card p-2 sm:p-3">
						{draft.times.length ? (
							<ul className="divide-y divide-border/60">
								{draft.times.map((time, index) => (
									<li key={index} className="flex min-w-0 items-center gap-2 px-2 py-2.5">
										<Input
											type="time"
											aria-label={`Class ${index + 1} starts`}
											value={time.start}
											onChange={(e) => setTime(index, { start: e.target.value })}
											className="h-11 w-0 max-w-36 min-w-0 flex-1 px-2.5 tabular-nums"
										/>
										<span aria-hidden className="text-muted-foreground">
											–
										</span>
										<Input
											type="time"
											aria-label={`Class ${index + 1} ends`}
											value={time.end}
											onChange={(e) => setTime(index, { end: e.target.value })}
											className="h-11 w-0 max-w-36 min-w-0 flex-1 px-2.5 tabular-nums"
										/>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											aria-label={`Remove the ${showTime(time.start)} class`}
											onClick={() => removeTime(index)}
											className="ml-auto size-11 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
										>
											<CloseCircle size={20} />
										</Button>
									</li>
								))}
							</ul>
						) : (
							<p className="px-3 py-6 text-center text-sm text-muted-foreground">No classes: the website says “by appointment”.</p>
						)}
						<Button type="button" variant="ghost" onClick={addTime} className="mt-1 h-11 w-full rounded-2xl text-primary">
							<Add size={20} />
							Add a time
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
