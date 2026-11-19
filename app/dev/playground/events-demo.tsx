"use client";

import { EventForm } from "@/components/events/event-form";
import { NotInCalendarNotice } from "@/components/events/not-in-calendar";
import { Reservations } from "@/components/events/reservations";
import { SessionRow } from "@/components/schedule/week-list";
import { eventFormValues } from "@/lib/domain/events/form";
import { places } from "@/lib/domain/events/rules";
import { type FeedSession } from "@/lib/domain/schedule/feed";
import { type BookingRequest } from "@/services/database/schema";

// A limited event: three reservations (one from the website for two people,
// one added by hand and paid, one new that came in when it was full).
const base = { kind: "event", choiceKey: "lever", choiceLabel: "Lever de soleil", message: null, lang: "fr", statusChangedAt: null, clientId: null, ipHash: null, erasedAt: null, sessionId: "s", createdAt: new Date() };
const reservations = [
	{ ...base, id: "r1", ref: "WEB-1A2B3C4D", name: "Salma Bennani", phone: "06 61 28 64 64", status: "confirmed", partySize: 2, source: "website", paidAt: null, arrivedWhenFull: false },
	{ ...base, id: "r2", ref: null, name: "Tom Whitaker", phone: "+44 7700 900123", status: "confirmed", partySize: 1, source: "whatsapp", paidAt: new Date(), arrivedWhenFull: false },
	{ ...base, id: "r3", ref: "WEB-9Z8Y7X6W", name: "Yasmine A.", phone: "0661000000", status: "new", partySize: 1, source: "website", paidAt: null, arrivedWhenFull: true },
] as unknown as BookingRequest[];

// Rows of the Schedule: a session that happened, and two outdoor sessions
// deleted in Google Calendar itself (one on the website, one not).
const row = (over: Partial<FeedSession>): FeedSession => ({
	id: "g",
	title: "Yoga au lever du soleil à l'Agafay",
	type: "outdoor",
	start: "2026-11-28T08:00:00.000Z",
	end: "2026-11-28T10:00:00.000Z",
	day: "2026-11-28",
	startTime: "08:00",
	endTime: "10:00",
	status: "scheduled",
	external: false,
	checkIns: 0,
	refunded: 0,
	cancelReason: null,
	event: null,
	notInCalendar: false,
	onWebsite: false,
	...over,
});

export function EventsDemo() {
	return (
		<section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 rounded-3xl border bg-card p-6" data-testid="events-demo">
			<h2 className="text-xl">Events</h2>
			<div className="flex flex-col gap-3" data-testid="schedule-rows">
				<SessionRow session={row({ id: "a", title: "Yoga en plein air à la Palmeraie", startTime: "14:00", endTime: "15:00" })} ended />
				<SessionRow session={row({ id: "b", notInCalendar: true, onWebsite: true })} ended={false} />
				<SessionRow session={row({ id: "c", title: "Coucher de soleil au lac Lalla Takerkoust", startTime: "16:00", endTime: "17:30", notInCalendar: true })} ended={false} />
			</div>
			<NotInCalendarNotice sessionId="s" phase="upcoming" />
			<Reservations sessionId="s" reservations={reservations} places={places(3, 3)} cancelled={false} />
			<EventForm
				sessionId="s"
				cancelled={false}
				initial={eventFormValues({
					title: "Lever de soleil à la Palmeraie",
					startsAt: new Date("2026-11-22T07:00:00Z"),
					endsAt: new Date("2026-11-22T09:00:00Z"),
					price: "250.00",
					onWebsite: true,
					descriptionFr: "Une heure de pratique au lever du soleil.",
					titleEn: null,
					descriptionEn: null,
					placeName: "Palmeraie",
					placeMapsUrl: null,
					capacity: 3,
				} as never)}
			/>
		</section>
	);
}
