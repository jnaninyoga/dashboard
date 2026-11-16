import { studioDateString, toStudioTime } from "@/lib/utils/time";
import { type EventFormInput } from "@/lib/validators/event";
import { type Event } from "@/services/database/schema";

const pad = (n: number) => String(n).padStart(2, "0");
/** An instant as the studio's wall clock: its date and its time ("HH:mm"). */
const wall = (instant: Date) => {
	const t = toStudioTime(instant);
	return { date: studioDateString(instant), time: `${pad(t.getHours())}:${pad(t.getMinutes())}` };
};

/** What the event form starts from: a saved event, or a new one next Sunday morning. */
export function eventFormValues(event: Event | null, now: Date = new Date()): EventFormInput {
	if (!event) {
		const sunday = new Date(now.getTime() + ((7 - toStudioTime(now).getDay()) % 7 || 7) * 86_400_000);
		const date = studioDateString(sunday);
		return {
			titleFr: "",
			titleEn: "",
			descriptionFr: "",
			descriptionEn: "",
			startDate: date,
			startTime: "08:00",
			endDate: date,
			endTime: "10:00",
			placeName: "",
			placeMapsUrl: "",
			price: "",
			limited: false,
			capacity: null,
		};
	}
	const start = wall(event.startsAt);
	const end = wall(event.endsAt);
	const price = Number(event.price);
	return {
		titleFr: event.titleFr,
		titleEn: event.titleEn ?? "",
		descriptionFr: event.descriptionFr,
		descriptionEn: event.descriptionEn ?? "",
		startDate: start.date,
		startTime: start.time,
		endDate: end.date,
		endTime: end.time,
		placeName: event.placeName,
		placeMapsUrl: event.placeMapsUrl ?? "",
		price: Number.isInteger(price) ? String(price) : price.toFixed(2),
		limited: event.capacity !== null,
		capacity: event.capacity === null ? null : String(event.capacity),
	};
}
