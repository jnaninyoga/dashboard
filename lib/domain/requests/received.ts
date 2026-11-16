import { lastVisitLabel } from "@/lib/domain/clients/card";
import { toStudioTime } from "@/lib/utils/time";

/**
 * When a request arrived, in Marrakech time: "Today 9:41", "Yesterday 18:02",
 * "Mon 1 Jun 9:05", or "30 Dec 2025" for another year.
 */
export function receivedLabel(createdAt: Date, now: Date = new Date()): string {
	const day = lastVisitLabel(createdAt, now);
	// Another year reads "30 Dec 2025": old enough that the hour doesn't matter.
	if (/\d{4}$/.test(day)) return day;
	const t = toStudioTime(createdAt);
	return `${day} ${t.getHours()}:${String(t.getMinutes()).padStart(2, "0")}`;
}
