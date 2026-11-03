"use client";

import type { ComponentType } from "react";
import Link from "next/link";

import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { CalendarEvent } from "@/lib/types";
import { formatMoney } from "@/lib/utils/currency";
import { toStudioTime, wallClockOf } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";

import { format, isWithinInterval, parseISO, subMinutes } from "date-fns";
import type { Icon } from "iconsax-reactjs";
import {
	Buildings,
	Calendar,
	ClipboardTick,
	Clock,
	LoginCurve,
	Profile2User,
	Sun1,
	Tag,
	User,
} from "iconsax-reactjs";

import { CancelEventButton } from "./cancel-button";
import { GuestAvatarStack } from "./guest-stack";
import {
	HexPattern,
	LotusPattern,
	MandalaPattern,
	SunPattern,
} from "./patterns";
import { TYPE_LABEL } from "./type-labels";

export type EventTypeKey = "group" | "private" | "b2b" | "outdoor";

type TypeMeta = {
	label: string;
	Icon: Icon;
	Pattern: ComponentType<{ className?: string }>;
	accent: string; // text + border color for badge/pattern
	badge: string; // badge background
	ribbon: string; // left edge gradient tint
	cta: string; // CTA button bg + hover colored glow (establishes per-card harmony)
	liveGlow: string; // always-on glow when the event is currently live
};

// Tailwind arbitrary-value shadows — these must be full static strings so the JIT picks them up.
const CTA_TEAL =
	"hover:shadow-[0_6px_24px_rgba(29,126,142,0.45)] hover:-translate-y-0.5";
const CTA_ROSE =
	"hover:shadow-[0_6px_24px_rgba(214,127,125,0.5)] hover:-translate-y-0.5";
const CTA_VIOLET =
	"hover:shadow-[0_6px_24px_rgba(139,92,246,0.45)] hover:-translate-y-0.5";
const CTA_AMBER =
	"hover:shadow-[0_6px_24px_rgba(245,158,11,0.45)] hover:-translate-y-0.5";

export const TYPE_META: Record<EventTypeKey, TypeMeta> = {
	group: {
		label: TYPE_LABEL.group,
		Icon: Profile2User,
		Pattern: MandalaPattern,
		accent: "text-primary",
		badge: "bg-primary/10 ring-1 ring-primary/20",
		ribbon: "from-primary/15",
		cta: cn("bg-primary text-primary-foreground hover:bg-primary/90", CTA_TEAL),
		liveGlow: "shadow-[0_6px_24px_rgba(29,126,142,0.45)]",
	},
	private: {
		label: TYPE_LABEL.private,
		Icon: User,
		Pattern: LotusPattern,
		accent: "text-secondary-foreground",
		badge: "bg-secondary ring-1 ring-secondary-2/60",
		ribbon: "from-secondary-3/20",
		cta: cn("bg-secondary-3 text-white hover:bg-secondary-3/90", CTA_ROSE),
		liveGlow: "shadow-[0_6px_24px_rgba(214,127,125,0.5)]",
	},
	b2b: {
		label: TYPE_LABEL.b2b,
		Icon: Buildings,
		Pattern: HexPattern,
		accent: "text-violet-700 dark:text-violet-300",
		badge: "bg-violet-500/10 ring-1 ring-violet-500/25",
		ribbon: "from-violet-500/15",
		cta: cn("bg-violet-600 text-white hover:bg-violet-700", CTA_VIOLET),
		liveGlow: "shadow-[0_6px_24px_rgba(139,92,246,0.45)]",
	},
	outdoor: {
		label: TYPE_LABEL.outdoor,
		Icon: Sun1,
		Pattern: SunPattern,
		accent: "text-amber-700 dark:text-amber-400",
		badge: "bg-amber-500/10 ring-1 ring-amber-500/45",
		ribbon: "from-amber-500/15",
		cta: cn("bg-amber-500 text-white hover:bg-amber-500/90", CTA_AMBER),
		liveGlow: "shadow-[0_6px_24px_rgba(245,158,11,0.45)]",
	},
};

export function EventCard({ event, checkIns }: { event: CalendarEvent; checkIns?: number }) {
	const calendarLink = event.htmlLink as string | undefined;
	const startIso = event.start?.dateTime;
	const endIso = event.end?.dateTime;

	if (!startIso || !endIso) return null; // Ignore all-day events for now

	const startTime = parseISO(startIso);
	const endTime = parseISO(endIso);
	const now = new Date();

	// Live if 'now' is between 15 mins before start and endTime
	const isLive = isWithinInterval(now, {
		start: subMinutes(startTime, 15),
		end: endTime,
	});

	// Past events are read-only: no cancel, no check-in — only attendance history.
	const isPast = endTime < now;

	const eventType = event.extendedProperties?.private?.jnaninEventType as
		| EventTypeKey
		| undefined;
	const outdoorPrice = event.extendedProperties?.private?.outdoorPrice as
		| string
		| undefined;
	const b2bPrice = event.extendedProperties?.private?.jnaninEventPrice as
		| string
		| undefined;
	const b2bPaxLabel = event.extendedProperties?.private?.jnaninB2BPaxLabel as
		| string
		| undefined;

	const meta = (eventType && TYPE_META[eventType]) ?? null;
	const TypeIcon = meta?.Icon;
	const Pattern = meta?.Pattern;

	// Off-site events are managed entirely in Google Calendar; no check-in to record.
	const isOffsite = eventType === "b2b" || eventType === "outdoor";

	return (
		<Card
			className={cn(
				"group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/70 transition-all duration-300 ease-out md:flex-row md:items-center",
				isLive
					? "zen-shadow-md hover:zen-shadow-lg bg-card ring-1 ring-success/50 hover:-translate-y-0.5"
					: isPast
						? "zen-shadow bg-card opacity-70 grayscale-40 hover:opacity-95"
						: "zen-shadow hover:zen-shadow-md bg-card hover:-translate-y-0.5",
			)}
		>
			{/* Cancel affordance — X in the top-right corner. Hidden for past events (read-only). */}
			{!isPast && event.id ? (
				<div className="absolute top-2 right-2 z-20">
					<CancelEventButton eventId={event.id} eventTitle={event.summary} />
				</div>
			) : null}

			{/* Left edge accent — colored gradient bleed */}
			{meta ? (
				<div
					aria-hidden
					className={cn(
						"pointer-events-none absolute inset-y-0 left-0 w-32 bg-linear-to-r to-transparent",
						meta.ribbon,
					)}
				/>
			) : null}

			{/* Right background pattern — large, bleeding past the card edge, tinted with accent */}
			{Pattern && meta ? (
				<div
					aria-hidden
					className={cn(
						"pointer-events-none absolute -top-10 -right-16 size-[280px] transition-all duration-700 ease-out",
						isPast
							? "opacity-[0.1]"
							: "opacity-[0.2] group-hover:rotate-6 group-hover:opacity-[0.32]",
						meta.accent,
					)}
				>
					<Pattern />
				</div>
			) : null}

			<div className="relative flex flex-1 flex-col justify-center p-6">
				<div className="mb-3 flex items-center gap-3">
					{meta && TypeIcon ? (
						<span
							className={cn(
								"inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.14em] uppercase",
								meta.badge,
								meta.accent,
							)}
						>
							<TypeIcon className="size-3.5" variant="Bulk" />
							{meta.label}
						</span>
					) : (
						<span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
							Session
						</span>
					)}
					{isLive ? (
						<span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-success shadow-sm backdrop-blur-sm">
							<span className="relative flex size-2">
								<span className="absolute inline-flex size-full animate-ping rounded-full bg-success/70 opacity-75"></span>
								<span className="relative inline-flex size-2 rounded-full bg-success"></span>
							</span>
							<span className="text-[10px] font-bold tracking-wider uppercase">
								Live
							</span>
						</span>
					) : null}
				</div>
				<CardTitle
					className="pr-2 font-heading text-2xl leading-tight font-semibold text-foreground md:text-[1.7rem]"
					title={event.summary ?? undefined}
				>
					{event.summary || "Untitled Event"}
				</CardTitle>
				<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-medium text-muted-foreground">
					<span className="flex items-center">
						<Clock className="mr-2 size-4" />
						{/* The studio's clock as Google placed it; our zone data only as a fallback. */}
						{wallClockOf(startIso)?.time ?? format(toStudioTime(startTime), "HH:mm")} –{" "}
						{wallClockOf(endIso)?.time ?? format(toStudioTime(endTime), "HH:mm")}
					</span>
					{checkIns ? (
						<span className="flex items-center text-foreground">
							<ClipboardTick className="mr-2 size-4 text-primary" variant="Bulk" />
							{checkIns} checked in
						</span>
					) : null}
					{eventType === "outdoor" && outdoorPrice ? (
						<span className="flex items-center">
							<Tag className="mr-2 size-4" variant="Bulk" />
							<Money amount={outdoorPrice} />
						</span>
					) : null}
					{eventType === "outdoor" && event.attendees && event.attendees.length > 0 ? (
						<span className="flex items-center border-l border-border/50 pl-4">
							<GuestAvatarStack attendees={event.attendees} />
						</span>
					) : null}
					{eventType === "b2b" && (b2bPaxLabel || b2bPrice) ? (
						<span className="flex items-center">
							<Buildings className="mr-2 size-4" variant="Bulk" />
							{[b2bPaxLabel, b2bPrice ? formatMoney(b2bPrice) : null]
								.filter(Boolean)
								.join(" · ")}
						</span>
					) : null}
					{!isOffsite && calendarLink ? (
						<a
							href={calendarLink}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 underline decoration-transparent underline-offset-4 transition-colors duration-200 hover:text-primary hover:decoration-current"
						>
							<Calendar className="size-4" variant="Bulk" />
							<span>Open in Calendar</span>
						</a>
					) : null}
				</div>

			</div>

			<div className="relative mt-auto p-5 md:mt-0 md:bg-transparent md:p-6 md:pl-0">
				{isOffsite ? (
					<Button
						asChild
						disabled={!calendarLink}
						className={cn(
							"min-h-[48px] w-full rounded-2xl px-8 font-semibold transition-all md:min-h-[44px] md:w-auto",
							meta?.cta,
						)}
					>
						<a
							href={calendarLink ?? "#"}
							target="_blank"
							rel="noopener noreferrer"
							aria-label="Open in Google Calendar"
						>
							<Calendar className="mr-2 size-4" variant="Bulk" />
							Open in Calendar
						</a>
					</Button>
				) : (
					<Button
						asChild
						variant={isPast ? "outline" : "default"}
						className={cn(
							"min-h-[48px] w-full rounded-2xl px-8 font-semibold transition-all md:min-h-[44px] md:w-auto",
							!isPast && meta?.cta,
							isLive && meta?.liveGlow,
							isPast &&
								"border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground",
						)}
					>
						<Link href={`/check-in/${event.id}`}>
							{isPast ? (
								<ClipboardTick className="mr-2 size-4" variant="Bulk" />
							) : (
								<LoginCurve className="mr-2 size-4" variant="Bulk" />
							)}
							{isPast ? "Attendance" : "Check In"}
						</Link>
					</Button>
				)}
			</div>
		</Card>
	);
}
