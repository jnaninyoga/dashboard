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
	title: string;
	onWebsite: boolean;
	descriptionFr: string;
	startsAt: Date;
	endsAt: Date;
	placeName: string;
	price: number;
	capacity: number | null;
};

/** What stops an outdoor session from being saved, in her words. The website's text is needed only to show it there. */
export function eventProblems(event: EventInput): string[] {
	const problems: string[] = [];
	if (!event.title.trim()) problems.push("Give it a title");
	if (event.onWebsite && !event.descriptionFr.trim()) problems.push("Write the French description, or turn off Show on the website");
	if (event.onWebsite && !event.placeName.trim()) problems.push("Say where it happens, or turn off Show on the website");
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

type Listing = {
	status: "scheduled" | "cancelled";
	onWebsite: boolean;
	slug: string | null;
	descriptionFr: string | null;
	placeName: string | null;
};

/** On the website: switched on, with its address, its French description and its place. */
export const isListed = (s: Listing) => s.onWebsite && !!s.slug && !!s.descriptionFr?.trim() && !!s.placeName?.trim();

export type EventPhase = "off" | "upcoming" | "ongoing" | "past" | "cancelled";

/** Where an outdoor session stands as an event at `now`: off the website, coming, happening, past, or cancelled. */
export function eventPhase(session: Listing & { startsAt: Date; endsAt: Date }, now: Date = new Date()): EventPhase {
	if (session.status === "cancelled") return "cancelled";
	if (!isListed(session)) return "off";
	if (now < session.startsAt) return "upcoming";
	if (now < session.endsAt) return "ongoing";
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
	/** When the photo last changed (ms): part of its address, so a new photo is never served from an old cache. */
	photoVersion: number | null;
};

type SessionRow = Listing & {
	title: string;
	titleEn: string | null;
	descriptionEn: string | null;
	startsAt: Date;
	endsAt: Date;
	placeMapsUrl: string | null;
	price: string | null;
	capacity: number | null;
	publishedAt: Date | null;
	photoUpdatedAt: Date | null;
};

const orNull = (text: string | null) => (text?.trim() ? text.trim() : null);

/**
 * The outdoor sessions the website shows as events: the ones on it, and the
 * cancelled ones it showed (their page stays). Never one switched off or not
 * written yet.
 */
export function siteEvents(rows: SessionRow[]): SiteEvent[] {
	return rows
		.filter((s) => isListed(s) && (s.status === "scheduled" || s.publishedAt !== null))
		.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
		.map((s) => ({
			slug: s.slug!,
			title: { fr: s.title, en: orNull(s.titleEn) },
			description: { fr: s.descriptionFr!.trim(), en: orNull(s.descriptionEn) },
			startsAt: s.startsAt.toISOString(),
			endsAt: s.endsAt.toISOString(),
			place: s.placeName!.trim(),
			mapsUrl: s.placeMapsUrl,
			price: Number(s.price ?? 0),
			capacity: s.capacity,
			status: s.status === "cancelled" ? ("cancelled" as const) : ("published" as const),
			photo: s.photoUpdatedAt !== null,
			photoVersion: s.photoUpdatedAt ? s.photoUpdatedAt.getTime() : null,
		}));
}
