// Outdoor events: a paid extra she advertises on the website. The rules for
// their address, their places, what makes one ready, and what the site sees.

/** "Lever de soleil à la Palmeraie !" → "lever-de-soleil-a-la-palmeraie": the event's address on the site. */
export function slugify(title: string): string {
	const slug = title
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 60)
		.replace(/-+$/g, "");
	return slug || "evenement";
}

/** The address, with "-2", "-3"… when another event already has it. */
export function uniqueSlug(slug: string, taken: readonly string[]): string {
	if (!taken.includes(slug)) return slug;
	let n = 2;
	while (taken.includes(`${slug}-${n}`)) n++;
	return `${slug}-${n}`;
}

export type Places = { capacity: number | null; confirmed: number; left: number | null; full: boolean };

/** Places count people (a booking for three takes three). Without a limit there is no count. */
export function places(capacity: number | null, confirmedPeople: number): Places {
	if (capacity === null) return { capacity: null, confirmed: confirmedPeople, left: null, full: false };
	const left = Math.max(0, capacity - confirmedPeople);
	return { capacity, confirmed: confirmedPeople, left, full: left === 0 };
}

/** Whether a group of `partySize` still fits. */
export function canTake(capacity: number | null, confirmedPeople: number, partySize: number): boolean {
	return capacity === null || confirmedPeople + partySize <= capacity;
}

/** A new limit can't leave people she already confirmed without a place. */
export function capacityProblem(capacity: number | null, confirmedPeople: number): string | null {
	if (capacity === null || capacity >= confirmedPeople) return null;
	return `${confirmedPeople} places are already confirmed: the limit can't go under ${confirmedPeople}.`;
}

/** The most people one website booking can be for; bigger groups she adds by hand. */
export const MAX_PARTY = 10;

type EventInput = {
	titleFr: string;
	descriptionFr: string;
	startsAt: Date;
	endsAt: Date;
	placeName: string;
	price: number;
	capacity: number | null;
};

/** What stops an event from being saved, in her words. */
export function eventProblems(event: EventInput): string[] {
	const problems: string[] = [];
	if (!event.titleFr.trim()) problems.push("Give it a French title");
	if (!event.descriptionFr.trim()) problems.push("Write the French description");
	if (!event.placeName.trim()) problems.push("Say where it happens");
	if (!(event.endsAt.getTime() > event.startsAt.getTime())) problems.push("It has to end after it starts");
	if (!(event.price >= 0)) problems.push("The price can't be negative");
	if (event.capacity !== null && !(event.capacity >= 1)) problems.push("At least 1 place, or no limit");
	return problems;
}

/** Which English fields she left empty: the English site then shows the French. */
export function englishMissing(event: { titleEn: string | null; descriptionEn: string | null }) {
	return { title: !event.titleEn?.trim(), description: !event.descriptionEn?.trim() };
}

/** Google Translate, French to English, with her text already in. */
export function googleTranslateUrl(text: string): string {
	return `https://translate.google.com/?sl=fr&tl=en&op=translate&text=${encodeURIComponent(text)}`;
}

export type EventPhase = "draft" | "upcoming" | "ongoing" | "past" | "cancelled";

/** Where an event stands at `now`. */
export function eventPhase(
	event: { status: "draft" | "published" | "cancelled"; startsAt: Date; endsAt: Date },
	now: Date = new Date(),
): EventPhase {
	if (event.status === "draft") return "draft";
	if (event.status === "cancelled") return "cancelled";
	if (now < event.startsAt) return "upcoming";
	if (now < event.endsAt) return "ongoing";
	return "past";
}

/** An event as the website receives it. */
export type SiteEvent = {
	slug: string;
	title: { fr: string; en: string | null };
	description: { fr: string; en: string | null };
	startsAt: string;
	endsAt: string;
	place: string;
	mapsUrl: string | null;
	price: number;
	capacity: number | null;
	status: "published" | "cancelled";
	photo: boolean;
};

type EventRow = {
	slug: string;
	titleFr: string;
	titleEn: string | null;
	descriptionFr: string;
	descriptionEn: string | null;
	startsAt: Date;
	endsAt: Date;
	placeName: string;
	placeMapsUrl: string | null;
	price: string;
	capacity: number | null;
	status: "draft" | "published" | "cancelled";
	publishedAt: Date | null;
	hasPhoto: boolean;
};

const orNull = (text: string | null) => (text?.trim() ? text.trim() : null);

/** The events the website shows: published ones, and cancelled ones that were published (their page stays). Never drafts. */
export function siteEvents(rows: EventRow[]): SiteEvent[] {
	return rows
		.filter((e) => e.status === "published" || (e.status === "cancelled" && e.publishedAt !== null))
		.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
		.map((e) => ({
			slug: e.slug,
			title: { fr: e.titleFr, en: orNull(e.titleEn) },
			description: { fr: e.descriptionFr, en: orNull(e.descriptionEn) },
			startsAt: e.startsAt.toISOString(),
			endsAt: e.endsAt.toISOString(),
			place: e.placeName,
			mapsUrl: e.placeMapsUrl,
			price: Number(e.price),
			capacity: e.capacity,
			status: e.status as "published" | "cancelled",
			photo: e.hasPhoto,
		}));
}
