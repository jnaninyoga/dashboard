"use client";

import Link from "next/link";

import { cn } from "@/lib/utils/ui";

import { ArrowLeft2 } from "iconsax-reactjs";

import { type EventTypeKey, TYPE_META } from "./events/card";

const KIND: Record<EventTypeKey, string> = {
	group: "Group class",
	private: "Private session",
	outdoor: "Outdoor",
	b2b: "Partner session",
};

export type SessionMoment = "live" | "upcoming" | "ended" | "cancelled";

/**
 * The session at the top of its check-in, in the Schedule's card language
 * (its type's colour, pattern and badge), so the door opens on the same
 * card she tapped; with where it stands now: live, starting, over or
 * cancelled.
 */
export function CheckInHeader({
	title,
	type,
	when,
	moment,
	startsAt,
	backHref,
}: {
	title: string;
	type: EventTypeKey;
	/** "Monday 2 November · 15:00 – 16:00". */
	when: string;
	moment: SessionMoment;
	/** "15:00", for "Starts at 15:00". */
	startsAt?: string;
	backHref: string;
}) {
	const meta = TYPE_META[type] ?? TYPE_META.group;
	const { Icon, Pattern } = meta;

	return (
		<header className="relative overflow-hidden rounded-3xl border border-border/70 bg-card px-5 pt-3 pb-6 sm:px-7 sm:pb-7">
			<div aria-hidden className={cn("pointer-events-none absolute inset-y-0 left-0 w-40 bg-linear-to-r to-transparent", meta.ribbon)} />
			<div
				aria-hidden
				className={cn(
					"pointer-events-none absolute -top-12 -right-16 size-64 opacity-[0.18] sm:-right-8 sm:size-72",
					moment === "ended" || moment === "cancelled" ? "opacity-[0.1]" : "",
					meta.accent,
				)}
			>
				<Pattern />
			</div>

			<div className="relative flex flex-col gap-3">
				<Link
					href={backHref}
					className="-ml-2 inline-flex min-h-10 items-center gap-1 self-start rounded-full px-2 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
				>
					<ArrowLeft2 size={16} />
					Schedule
				</Link>

				<div className="flex flex-wrap items-center gap-2">
					<span className={cn("inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium", meta.badge, meta.accent)}>
						<Icon size={16} variant="Bulk" />
						{KIND[type] ?? "Session"}
					</span>
					{moment === "live" ? (
						<span className="inline-flex h-7 items-center gap-2 rounded-full bg-success/10 px-2.5 text-sm font-medium text-success">
							<span className="relative flex size-2">
								<span className="absolute inline-flex size-full animate-ping rounded-full bg-success/60 motion-reduce:animate-none" />
								<span className="relative inline-flex size-2 rounded-full bg-success" />
							</span>
							Live now
						</span>
					) : moment === "upcoming" ? (
						<span className="inline-flex h-7 items-center rounded-full bg-muted px-2.5 text-sm font-medium text-muted-foreground">
							Starts at {startsAt}
						</span>
					) : moment === "cancelled" ? (
						<span className="inline-flex h-7 items-center rounded-full bg-destructive/10 px-2.5 text-sm font-medium text-destructive">
							Cancelled
						</span>
					) : (
						<span className="inline-flex h-7 items-center rounded-full bg-muted px-2.5 text-sm font-medium text-muted-foreground">
							Ended
						</span>
					)}
				</div>

				<div className="flex flex-col gap-1">
					<h1 className="pr-16 font-heading text-3xl leading-tight font-semibold tracking-tight text-foreground md:text-4xl">{title}</h1>
					<p className="text-muted-foreground tabular-nums">{when}</p>
				</div>
			</div>
		</header>
	);
}
