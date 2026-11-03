"use client";

import { useState } from "react";
import Link from "next/link";

import { DocumentSection } from "@/components/b2b/documents/document-section";
import { TYPE_META } from "@/components/schedule/events/card";
import { typeLabel } from "@/components/schedule/events/type-labels";
import { type ClientVisit } from "@/lib/actions/clients/queries";
import { STUDIO_TIME_ZONE, studioDateString } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";

import { ArrowDown2, ArrowRight2 } from "iconsax-reactjs";

/** Enough to see their rhythm; the rest a tap away. */
const FIRST = 6;

const dayParts = new Intl.DateTimeFormat("en-GB", { timeZone: STUDIO_TIME_ZONE, weekday: "short", day: "numeric", month: "short" });
const yearPart = new Intl.DateTimeFormat("en-GB", { timeZone: STUDIO_TIME_ZONE, year: "numeric" });
const timePart = new Intl.DateTimeFormat("en-GB", { timeZone: STUDIO_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** "Thu 29 Oct", with the year when it isn't this one. */
function visitDay(instant: Date, thisYear: string) {
	const year = yearPart.format(instant);
	return `${dayParts.format(instant).replace(",", "")}${year === thisYear ? "" : ` ${year}`}`;
}

/**
 * Every time the client came, the latest first: the day and time, the
 * session, and the card that paid. A session cancelled later stays,
 * marked, its credit given back. Each opens that session's attendance.
 */
export function VisitsSection({ visits }: { visits: ClientVisit[] }) {
	const [all, setAll] = useState(false);
	const now = new Date();
	const thisYear = yearPart.format(now);
	const month = studioDateString(now).slice(0, 7);
	const came = visits.filter((visit) => !visit.cancelledAt);
	const thisMonth = came.filter((visit) => studioDateString(new Date(visit.checkInTime)).startsWith(month)).length;
	const shown = all ? visits : visits.slice(0, FIRST);

	return (
		<DocumentSection
			id="visits"
			title="Visits"
			aside={
				came.length ? (
					<span className="text-sm text-muted-foreground tabular-nums">
						{thisMonth} this month, {came.length} in all
					</span>
				) : null
			}
		>
			<div className="overflow-hidden rounded-2xl border bg-card">
				{visits.length ? (
					<ul className="divide-y divide-border">
						{shown.map((visit) => {
							const at = new Date(visit.checkInTime);
							const cancelled = !!visit.cancelledAt;
							const meta = TYPE_META[visit.slotType] ?? TYPE_META.group;
							const row = (
								<>
									{/* The session's own pattern in its colours, as on its card in the
									    Schedule (Flower of Life, lotus, sun, honeycomb); greyed when cancelled.
									    The patterns' hairline is drawn for a large card: thickened here. */}
									<span
										aria-hidden
										className={cn(
											"flex size-11 shrink-0 items-center justify-center rounded-2xl p-1",
											cancelled ? "bg-muted text-muted-foreground/60" : cn(meta.badge, meta.accent),
										)}
									>
										<meta.Pattern className="stroke-7" />
									</span>
									<span className="min-w-0 flex-1">
										<span className={cn("block truncate font-medium", cancelled ? "text-muted-foreground line-through decoration-muted-foreground/40" : "text-foreground")}>
											{visit.sessionTitle ?? typeLabel(visit.slotType)}
										</span>
										<span className="block truncate text-sm text-muted-foreground">
											{cancelled
												? "Session cancelled, credit given back"
												: visit.slotType === "outdoor"
													? "Outdoor, no credit taken"
													: (visit.cardName ?? "Membership card")}
										</span>
									</span>
									<span className="shrink-0 text-right tabular-nums">
										<span className={cn("block font-medium", cancelled ? "text-muted-foreground" : "text-foreground")}>{visitDay(at, thisYear)}</span>
										<span className="block text-sm text-muted-foreground">{timePart.format(at)}</span>
									</span>
								</>
							);
							return (
								<li key={visit.id}>
									{visit.googleEventId ? (
										<Link
											href={`/check-in/${visit.googleEventId}`}
											className="group flex items-center gap-3 px-5 py-3 outline-none hover:bg-muted/40 focus-visible:bg-muted/40"
										>
											{row}
											<ArrowRight2 size={16} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
										</Link>
									) : (
										<div className="flex items-center gap-3 px-5 py-3">{row}</div>
									)}
								</li>
							);
						})}
					</ul>
				) : (
					<p className="px-5 py-6 text-center text-sm text-muted-foreground">No visits yet. Each check-in shows here.</p>
				)}

				{visits.length > FIRST ? (
					<button
						type="button"
						onClick={() => setAll(!all)}
						aria-expanded={all}
						className="flex min-h-12 w-full items-center justify-center gap-1 border-t text-sm font-semibold text-primary outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
					>
						{all ? "Show fewer" : `Show all ${visits.length}`}
						<ArrowDown2 size={16} className={cn("transition-transform motion-reduce:transition-none", all && "rotate-180")} />
					</button>
				) : null}
			</div>
		</DocumentSection>
	);
}
