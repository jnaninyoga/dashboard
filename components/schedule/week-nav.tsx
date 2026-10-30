import Link from "next/link";

import { type SessionType } from "@/lib/domain/schedule/feed";
import { addDays, formatDay } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";

import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";

export const SESSION_TYPES: { value: SessionType; label: string }[] = [
	{ value: "group", label: "Group" },
	{ value: "private", label: "Private" },
	{ value: "outdoor", label: "Outdoor" },
	{ value: "b2b", label: "B2B" },
];

/** The Schedule's address for a week and a type; this week and "all" stay implicit. */
export function scheduleHref(monday: string, currentMonday: string, type?: SessionType) {
	const params = new URLSearchParams();
	if (monday !== currentMonday) params.set("week", monday);
	if (type) params.set("type", type);
	const query = params.toString();
	return query ? `/schedule?${query}` : "/schedule";
}

function relativeWeek(monday: string, currentMonday: string) {
	const weeks = Math.round((Date.parse(monday) - Date.parse(currentMonday)) / (7 * 86_400_000));
	if (weeks === 0) return "This week";
	if (weeks === -1) return "Last week";
	if (weeks === 1) return "Next week";
	return weeks < 0 ? `${-weeks} weeks ago` : `In ${weeks} weeks`;
}

const arrow =
	"bg-card border-border/70 hover:bg-secondary/60 focus-visible:ring-ring flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors outline-none focus-visible:ring-2 active:scale-95";

/**
 * One week at a time, without limit either way; the week lives in the URL,
 * so the back button and shared links land on it.
 */
export function WeekNav({
	monday,
	currentMonday,
	type,
}: {
	monday: string;
	currentMonday: string;
	type?: SessionType;
}) {
	const sunday = addDays(monday, 6);
	const range = `${formatDay(monday, { day: "numeric", month: "short" })} – ${formatDay(sunday, { day: "numeric", month: "short", year: "numeric" })}`;
	const isCurrent = monday === currentMonday;

	return (
		<nav aria-label="Weeks" className="flex w-full items-center gap-3 lg:w-auto">
			<Link href={scheduleHref(addDays(monday, -7), currentMonday, type)} aria-label="Previous week" className={arrow}>
				<ArrowLeft2 size={20} />
			</Link>
			<div className="flex min-w-0 flex-1 flex-col items-center text-center lg:w-56 lg:flex-none">
				<span className="text-muted-foreground text-xs font-medium">{relativeWeek(monday, currentMonday)}</span>
				<span className="font-heading text-foreground truncate text-lg font-semibold">{range}</span>
				{isCurrent ? null : (
					<Link
						href={scheduleHref(currentMonday, currentMonday, type)}
						className="text-primary focus-visible:ring-ring mt-0.5 inline-flex min-h-10 items-center rounded-full px-3 text-sm font-semibold outline-none hover:underline focus-visible:ring-2"
					>
						Back to this week
					</Link>
				)}
			</div>
			<Link href={scheduleHref(addDays(monday, 7), currentMonday, type)} aria-label="Next week" className={arrow}>
				<ArrowRight2 size={20} />
			</Link>
		</nav>
	);
}

/** Narrows the week to one kind of session. */
export function TypeFilter({
	monday,
	currentMonday,
	type,
}: {
	monday: string;
	currentMonday: string;
	type?: SessionType;
}) {
	const chip =
		"focus-visible:ring-ring inline-flex h-10 shrink-0 items-center rounded-full border px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 sm:px-4";
	const options: { value?: SessionType; label: string }[] = [{ label: "All" }, ...SESSION_TYPES];
	return (
		// Scrolls sideways inside itself on a narrow phone; the page never does.
		<div role="group" aria-label="Session type" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:gap-2 sm:px-0">
			{options.map((option) => {
				const active = option.value === type;
				return (
					<Link
						key={option.label}
						href={scheduleHref(monday, currentMonday, option.value)}
						aria-current={active ? "true" : undefined}
						className={cn(
							chip,
							active
								? "bg-primary text-primary-foreground border-primary"
								: "bg-card text-muted-foreground border-border/70 hover:text-foreground hover:bg-secondary/40",
						)}
					>
						{option.label}
					</Link>
				);
			})}
		</div>
	);
}
