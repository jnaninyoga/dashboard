import { studioDateString, toStudioTime } from "@/lib/utils/time";
import { type EventFormInput } from "@/lib/validators/event";
import { type StudioSession } from "@/services/database/schema";

const pad = (n: number) => String(n).padStart(2, "0");
const timeOf = (instant: Date) => {
	const t = toStudioTime(instant);
	return `${pad(t.getHours())}:${pad(t.getMinutes())}`;
};

/** What an outdoor session's form starts from: the session as saved, in Marrakech time. */
export function eventFormValues(session: StudioSession): EventFormInput {
	const price = Number(session.price ?? 0);
	return {
		title: session.title,
		date: studioDateString(session.startsAt),
		startTime: timeOf(session.startsAt),
		endTime: timeOf(session.endsAt),
		price: Number.isInteger(price) ? String(price) : price.toFixed(2),
		onWebsite: session.onWebsite,
		titleEn: session.titleEn ?? "",
		descriptionFr: session.descriptionFr ?? "",
		descriptionEn: session.descriptionEn ?? "",
		placeName: session.placeName ?? "",
		placeMapsUrl: session.placeMapsUrl ?? "",
		limited: session.capacity !== null,
		capacity: session.capacity === null ? null : String(session.capacity),
	};
}
