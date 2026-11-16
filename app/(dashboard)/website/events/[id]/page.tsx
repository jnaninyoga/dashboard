import Link from "next/link";
import { notFound } from "next/navigation";

import { CalendarRetry, CancelEvent } from "@/components/events/event-actions";
import { EventForm } from "@/components/events/event-form";
import { EventPhoto } from "@/components/events/event-photo";
import { EventStatus } from "@/components/events/event-status";
import { Reservations } from "@/components/events/reservations";
import { getEvent } from "@/lib/actions/events";
import { eventFormValues } from "@/lib/domain/events/form";
import { eventPhase } from "@/lib/domain/events/rules";

import { ArrowLeft, ExportSquare } from "iconsax-reactjs";

const WEBSITE = (process.env.NEXT_PUBLIC_WEBSITE_URL ?? "https://jnaninyoga.com").replace(/\/$/, "");

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const { data: event, error } = await getEvent(id);
	if (error) throw new Error(error);
	if (!event) notFound();
	const phase = eventPhase(event);

	return (
		<>
			<Link href="/website/events" className="-ml-2 flex h-10 w-fit items-center gap-2 rounded-full px-2 text-sm font-medium text-muted-foreground hover:text-foreground">
				<ArrowLeft size={18} />
				Events
			</Link>

			<header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
				<div className="min-w-0 space-y-2">
					<div className="flex flex-wrap items-center gap-3">
						<h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">{event.titleFr}</h1>
						<EventStatus phase={phase} />
					</div>
					{event.status === "cancelled" && event.cancelReason ? <p className="text-sm text-destructive">Cancelled: {event.cancelReason}</p> : null}
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{event.publishedAt ? (
						<a
							href={`${WEBSITE}/evenements/${event.slug}/`}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-primary hover:bg-primary/10"
						>
							<ExportSquare size={18} />
							See it on the website
						</a>
					) : null}
					{event.status === "published" && !event.googleEventId ? <CalendarRetry id={event.id} /> : null}
					{event.status === "cancelled" ? null : <CancelEvent id={event.id} title={event.titleFr} />}
				</div>
			</header>

			<Reservations eventId={event.id} reservations={event.reservations} places={event.places} cancelled={event.status === "cancelled"} />

			<div className="grid gap-8 *:min-w-0 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
				<EventForm id={event.id} initial={eventFormValues(event)} status={event.status} />
				<section className="grid gap-3 xl:sticky xl:top-20">
					<h2 className="font-heading text-lg font-semibold">Photo</h2>
					<EventPhoto id={event.id} src={event.hasPhoto ? `/website/events/${event.id}/photo?v=${event.photoVersion}` : null} />
				</section>
			</div>
		</>
	);
}
