"use client";

import { useState } from "react";

import { SaveStatus, useAutosave } from "@/components/b2b/documents/use-autosave";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { setWorkingHours } from "@/lib/actions/settings";
import { DAYS, DEFAULT_HOURS } from "@/lib/config/schedule";
import { type WorkingHoursConfig } from "@/lib/types";
import { cn } from "@/lib/utils/ui";
import { workingHoursSchema } from "@/lib/validators/working-hours";

const minutes = (time: string) => {
	const [h, m] = time.split(":").map(Number);
	return h * 60 + m;
};
const hoursOf = (day: WorkingHoursConfig[string]) => (day.isOpen ? Math.max(0, minutes(day.end) - minutes(day.start)) / 60 : 0);
const hoursLabel = (h: number) => `${h.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} h`;

/**
 * The studio's week: each day open or closed, from when to when, drawn on
 * one time axis so the week reads at a glance. It saves itself; a day that
 * ends before it starts says so and waits. Sessions she schedules outside
 * these hours are refused.
 */
export function ScheduleForm({ initialData }: { initialData: WorkingHoursConfig | null }) {
	const [week, setWeek] = useState<WorkingHoursConfig>(() => ({ ...DEFAULT_HOURS, ...initialData }));

	const check = workingHoursSchema.safeParse(week);
	const problems = new Map<string, string>();
	if (!check.success) for (const issue of check.error.issues) problems.set(String(issue.path[0]), issue.message);

	const { state, changed } = useAutosave(
		async () => {
			if (!check.success) return { ok: false, invalid: true, message: check.error.issues[0].message.toLowerCase() };
			const result = await setWorkingHours(week);
			return result.success ? { ok: true } : { ok: false, invalid: !result.ref, message: result.error ?? "Couldn't save the hours" };
		},
		{ id: "hours", label: "Studio hours" },
	);

	const update = (key: string, patch: Partial<WorkingHoursConfig[string]>) => {
		setWeek((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
		changed();
	};

	// The axis spans the open hours, at least 6:00 to 22:00, marked every 4 hours.
	const open = DAYS.map((d) => week[d.key]).filter((d) => d?.isOpen && d.end > d.start);
	const from = Math.min(6, ...open.map((d) => Math.floor(minutes(d.start) / 240) * 4));
	const to = Math.max(22, ...open.map((d) => Math.ceil(minutes(d.end) / 240) * 4));
	const span = (to - from) * 60;
	const ticks = Array.from({ length: (to - from) / 4 + 1 }, (_, i) => from + i * 4);
	const at = (time: string) => `${((minutes(time) - from * 60) / span) * 100}%`;

	const total = DAYS.reduce((sum, d) => sum + hoursOf(week[d.key]), 0);
	const closed = DAYS.filter((d) => !week[d.key]?.isOpen).map((d) => d.label);

	return (
		<section aria-labelledby="week-title" className="grid gap-3">
			<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
				<h2 id="week-title" className="font-heading text-lg font-semibold">
					Open {open.length} {open.length === 1 ? "day" : "days"}, {hoursLabel(total)} a week
					{closed.length ? <span className="text-muted-foreground font-sans text-sm font-normal"> · closed {closed.join(", ")}</span> : null}
				</h2>
				<div className="flex items-center gap-2">
					{state.kind === "error" ? <span className="text-destructive text-sm">{state.message}</span> : null}
					<SaveStatus state={state} />
				</div>
			</div>

			<div className="bg-card rounded-2xl border">
				{/* The time axis, above the bars (wide screens only: on a phone each day reads its times). */}
				<div className="hidden px-4 pt-3 md:grid md:grid-cols-[9rem_1fr_18rem] md:gap-4">
					<span />
					<div className="text-muted-foreground relative h-4 text-xs tabular-nums">
						{ticks.map((hour, i) => (
							<span
								key={hour}
								// The ends sit inside the axis; the hours between are centred on their mark.
								className={cn("absolute", i === 0 ? "" : i === ticks.length - 1 ? "-translate-x-full" : "-translate-x-1/2")}
								style={{ left: `${(((hour - from) * 60) / span) * 100}%` }}
							>
								{String(hour).padStart(2, "0")}:00
							</span>
						))}
					</div>
					<span />
				</div>

				<ul className="divide-border divide-y">
					{DAYS.map(({ key, label }) => {
						const day = week[key];
						const problem = problems.get(key);
						const valid = day.isOpen && day.end > day.start;
						return (
							<li key={key} className="grid gap-3 px-4 py-3.5 md:grid-cols-[9rem_1fr_18rem] md:items-center md:gap-4">
								<label className="flex cursor-pointer items-center gap-3">
									<Switch checked={day.isOpen} onCheckedChange={(isOpen) => update(key, { isOpen })} aria-label={`${label} open`} />
									<span className={cn("font-medium", !day.isOpen && "text-muted-foreground")}>{label}</span>
									<span className="text-muted-foreground ml-auto text-sm tabular-nums md:hidden">
										{day.isOpen ? (valid ? hoursLabel(hoursOf(day)) : "") : "Closed"}
									</span>
								</label>

								{/* The day on the week's axis. */}
								<div
									className={cn("relative h-2.5 overflow-hidden rounded-full max-md:order-last", day.isOpen ? "bg-muted/70" : "max-md:hidden")}
									aria-hidden
								>
									{valid ? (
										<span
											className="bg-primary absolute inset-y-0 rounded-full transition-[left,width] duration-300"
											style={{ left: at(day.start), width: `calc(${at(day.end)} - ${at(day.start)})` }}
										/>
									) : null}
								</div>

								{day.isOpen ? (
									<div className="grid gap-1">
										<div className="flex items-center gap-2">
											<Input
												type="time"
												aria-label={`${label} opens`}
												value={day.start}
												onChange={(event) => update(key, { start: event.target.value })}
												className="h-10 tabular-nums"
											/>
											<span className="text-muted-foreground" aria-hidden>
												–
											</span>
											<Input
												type="time"
												aria-label={`${label} closes`}
												aria-invalid={!!problem}
												value={day.end}
												onChange={(event) => update(key, { end: event.target.value })}
												className="h-10 tabular-nums"
											/>
										</div>
										{problem ? <p className="text-destructive text-sm">{problem}</p> : null}
									</div>
								) : (
									<p className="text-muted-foreground text-sm max-md:hidden">Closed</p>
								)}
							</li>
						);
					})}
				</ul>
			</div>
		</section>
	);
}
