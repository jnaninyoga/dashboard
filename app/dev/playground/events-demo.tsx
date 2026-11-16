"use client";

import { EventForm } from "@/components/events/event-form";
import { Reservations } from "@/components/events/reservations";
import { eventFormValues } from "@/lib/domain/events/form";
import { places } from "@/lib/domain/events/rules";
import { type BookingRequest } from "@/services/database/schema";

// A limited event: three reservations (one from the website for two people,
// one added by hand and paid, one new that came in when it was full).
const base = { kind: "event", choiceKey: "lever", choiceLabel: "Lever de soleil", message: null, lang: "fr", statusChangedAt: null, clientId: null, ipHash: null, erasedAt: null, sessionId: "s", createdAt: new Date() };
const reservations = [
	{ ...base, id: "r1", ref: "WEB-1A2B3C4D", name: "Salma Bennani", phone: "06 61 28 64 64", status: "confirmed", partySize: 2, source: "website", paidAt: null, arrivedWhenFull: false },
	{ ...base, id: "r2", ref: null, name: "Tom Whitaker", phone: "+44 7700 900123", status: "confirmed", partySize: 1, source: "whatsapp", paidAt: new Date(), arrivedWhenFull: false },
	{ ...base, id: "r3", ref: "WEB-9Z8Y7X6W", name: "Yasmine A.", phone: "0661000000", status: "new", partySize: 1, source: "website", paidAt: null, arrivedWhenFull: true },
] as unknown as BookingRequest[];

export function EventsDemo() {
	return (
		<section className="grid min-w-0 gap-6 rounded-3xl border bg-card p-6" data-testid="events-demo">
			<h2 className="text-xl">Events</h2>
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
