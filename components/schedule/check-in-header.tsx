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
		<header className="bg-card border-border/70 relative overflow-hidden rounded-3xl border px-5 pt-3 pb-6 sm:px-7 sm:pb-7">
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
					className="text-muted-foreground hover:text-foreground focus-visible:ring-ring -ml-2 inline-flex min-h-10 items-center gap-1 self-start rounded-full px-2 text-sm font-medium outline-none focus-visible:ring-2"
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
						<span className="bg-success/10 text-success inline-flex h-7 items-center gap-2 rounded-full px-2.5 text-sm font-medium">
							<span className="relative flex size-2">
								<span className="bg-success/60 absolute inline-flex size-full animate-ping rounded-full motion-reduce:animate-none" />
								<span className="bg-success relative inline-flex size-2 rounded-full" />
							</span>
							Live now
						</span>
					) : moment === "upcoming" ? (
						<span className="bg-muted text-muted-foreground inline-flex h-7 items-center rounded-full px-2.5 text-sm font-medium">
							Starts at {startsAt}
						</span>
					) : moment === "cancelled" ? (
						<span className="bg-destructive/10 text-destructive inline-flex h-7 items-center rounded-full px-2.5 text-sm font-medium">
							Cancelled
						</span>
					) : (
						<span className="bg-muted text-muted-foreground inline-flex h-7 items-center rounded-full px-2.5 text-sm font-medium">
							Ended
						</span>
					)}
				</div>

				<div className="flex flex-col gap-1">
					<h1 className="font-heading text-foreground pr-16 text-3xl leading-tight font-semibold tracking-tight md:text-4xl">{title}</h1>
					<p className="text-muted-foreground tabular-nums">{when}</p>
				</div>
			</div>
		</header>
	);
}
