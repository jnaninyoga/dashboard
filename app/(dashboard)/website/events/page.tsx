import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { EntityCard, EntityCardFigures, EntityCardGrid, EntityCardHeader, Figure } from "@/components/entity-card";
import { EventStatus } from "@/components/events/event-status";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { getEvents } from "@/lib/actions/events";
import { eventPhase } from "@/lib/domain/events/rules";
import { formatDay, studioDateString } from "@/lib/utils/time";

import { Add, Tree } from "iconsax-reactjs";

/** "Sun 30 Nov" (and "→ Mon 1 Dec" when it runs over several days). */
function when(startsAt: Date, endsAt: Date) {
	const start = studioDateString(startsAt);
	const end = studioDateString(endsAt);
	const day = (d: string) => formatDay(d, { weekday: "short", day: "numeric", month: "short" });
	return start === end ? day(start) : `${day(start)} → ${day(end)}`;
}

/** Her outdoor events: the next ones first, then drafts, then past and cancelled. */
export default async function EventsPage() {
	const { data, error } = await getEvents();
	if (error) throw new Error(error);
	const now = new Date();
	const order = { ongoing: 0, upcoming: 1, draft: 2, past: 3, cancelled: 4 } as const;
	const events = (data ?? [])
		.map((event) => ({ event, phase: eventPhase(event, now) }))
		.sort((a, b) => order[a.phase] - order[b.phase] || (a.phase === "past" || a.phase === "cancelled" ? b.event.startsAt.getTime() - a.event.startsAt.getTime() : a.event.startsAt.getTime() - b.event.startsAt.getTime()));

	return (
		<>
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<header className="space-y-1">
					<h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">Events</h1>
					<p className="text-md text-muted-foreground">Outdoor events on jnaninyoga.com: a paid extra, with or without a card.</p>
				</header>
				<Button asChild className="zen-glow-teal h-11 px-6 font-bold shadow-sm">
					<Link href="/website/events/new">
						<Add className="mr-1 size-4" />
						New event
					</Link>
				</Button>
			</div>

			{events.length ? (
				<EntityCardGrid>
					{events.map(({ event, phase }) => (
						<EntityCard
							key={event.id}
							header={
								<EntityCardHeader
									href={`/website/events/${event.id}`}
									title={event.titleFr}
									media={
										event.hasPhoto ? (
											// eslint-disable-next-line @next/next/no-img-element -- her photo, from the dashboard
											<img src={`/website/events/${event.id}/photo?v=${event.photoVersion}`} alt="" className="size-14 rounded-2xl object-cover" />
										) : (
											<div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
												<Tree size={28} variant="Bulk" />
											</div>
										)
									}
								>
									<EventStatus phase={phase} />
									<span className="basis-full text-sm text-muted-foreground">
										{when(event.startsAt, event.endsAt)} · {event.placeName}
									</span>
								</EntityCardHeader>
							}
							figures={
								<EntityCardFigures>
									<Figure label="Price" value={Number(event.price) ? <Money amount={event.price} /> : "Free"} />
									<Figure
										label={event.capacity === null ? "Coming" : "Places"}
										value={event.capacity === null ? event.places.confirmed : `${event.places.confirmed}/${event.capacity}`}
										tone={event.places.full ? "low" : undefined}
									/>
								</EntityCardFigures>
							}
							actions={
								<p className="text-sm text-muted-foreground">
									{event.reservations ? `${event.reservations} ${event.reservations === 1 ? "reservation" : "reservations"}` : "No reservations yet"}
									{event.places.full ? " · Full" : ""}
								</p>
							}
						/>
					))}
				</EntityCardGrid>
			) : (
				<EmptyState
					icon={<Tree size={40} variant="Bulk" />}
					title="No events yet"
					description="Write up a morning in the Palmeraie or a weekend in the Atlas: once published, the website advertises it."
					action={
						<Button asChild className="h-11 rounded-full px-6">
							<Link href="/website/events/new">New event</Link>
						</Button>
					}
				/>
			)}
		</>
	);
}
