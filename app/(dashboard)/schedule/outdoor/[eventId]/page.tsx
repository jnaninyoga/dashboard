import Link from "next/link";
import { notFound } from "next/navigation";

import { CancelOutdoor } from "@/components/events/event-actions";
import { EventForm } from "@/components/events/event-form";
import { EventPhoto } from "@/components/events/event-photo";
import { EventStatus } from "@/components/events/event-status";
import { NotInCalendarNotice } from "@/components/events/not-in-calendar";
import { Reservations } from "@/components/events/reservations";
import { getOutdoorSession } from "@/lib/actions/outdoor";
import { eventFormValues } from "@/lib/domain/events/form";
import { BOOKING_CLOSES_HOURS, bookingClosesAt, eventPhase } from "@/lib/domain/events/rules";
import { STUDIO_TIME_ZONE, studioDateString, weekOf } from "@/lib/utils/time";

import { ArrowLeft, ExportSquare } from "iconsax-reactjs";

const WEBSITE = (process.env.NEXT_PUBLIC_WEBSITE_URL ?? "https://jnaninyoga.com").replace(/\/$/, "");

// "Mon 16 Nov, 11:00", in Marrakech time (made here, on the server, like every studio time).
const closingTime = new Intl.DateTimeFormat("en-GB", { timeZone: STUDIO_TIME_ZONE, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/**
 * An outdoor session, which is also its event on the website: who's coming,
 * the session and its website part in one form, and its photo.
 */
export default async function OutdoorSessionPage({ params }: { params: Promise<{ eventId: string }> }) {
	const { eventId } = await params;
	const { data: session, error } = await getOutdoorSession(eventId);
	if (error) throw new Error(error);
	if (!session) notFound();
	const phase = eventPhase(session);
	const cancelled = session.status === "cancelled";
	const week = weekOf(studioDateString(session.startsAt));
	const closes = closingTime.format(bookingClosesAt(session.startsAt));
	// Deleted in Google Calendar itself, and not over: she puts it back or cancels it.
	const notInCalendar = session.calendar === "missing" && !cancelled && session.endsAt > new Date();

	return (
		<>
			<Link href={`/schedule?week=${week}`} className="-ml-2 flex h-10 w-fit items-center gap-2 rounded-full px-2 text-sm font-medium text-muted-foreground hover:text-foreground">
				<ArrowLeft size={18} />
				Schedule
			</Link>

			<header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
				<div className="min-w-0 space-y-2">
					<div className="flex flex-wrap items-center gap-3">
						<h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">{session.title}</h1>
						<EventStatus phase={phase} />
					</div>
					<p className="text-sm text-muted-foreground">Outdoor session · on the website as an outdoor event when “Show on the website” is on.</p>
					{cancelled && session.cancelReason ? <p className="text-sm text-destructive">Cancelled: {session.cancelReason}</p> : null}
					{phase === "upcoming" ? (
						<p className="text-sm text-muted-foreground">
							Website bookings close {closes}, {BOOKING_CLOSES_HOURS} hours before it starts. After that, add reservations by hand.
						</p>
					) : null}
					{phase === "closed" ? <p className="text-sm text-muted-foreground">Website bookings closed {closes}. You can still add reservations by hand.</p> : null}
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{session.publishedAt && session.slug ? (
						<a
							href={`${WEBSITE}/evenements/${session.slug}/`}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-primary hover:bg-primary/10"
						>
							<ExportSquare size={18} />
							See it on the website
						</a>
					) : null}
					{cancelled ? null : <CancelOutdoor googleEventId={session.googleEventId} title={session.title} />}
				</div>
			</header>

			{notInCalendar ? <NotInCalendarNotice sessionId={session.id} phase={phase} /> : null}

			<Reservations sessionId={session.id} reservations={session.reservations} places={session.places} cancelled={cancelled} />

			<div className="grid gap-8 *:min-w-0 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
				<EventForm sessionId={session.id} initial={eventFormValues(session)} cancelled={cancelled} />
				<section className="grid gap-3 xl:sticky xl:top-20">
					<h2 className="font-heading text-lg font-semibold">Photo for the website</h2>
					<EventPhoto sessionId={session.id} src={session.hasPhoto ? `/schedule/outdoor/${session.googleEventId}/photo?v=${session.photoVersion}` : null} />
				</section>
			</div>
		</>
	);
}
