// The membership cards the website shows, and everything the site builds from.

import { type SiteEvent } from "@/lib/domain/events/rules";
import { type WorkingHoursConfig } from "@/lib/domain/schedule/hours";

import { type SiteHours, siteHours } from "./timetable";

/** A card on the website: its key in the site's links and copy, and its numbers. */
export type SiteCard = { key: string; name: string; credits: number; months: number | null; price: number; popular: boolean };

type CardProduct = {
	kind: "membership" | "partner_service";
	name: string;
	price: string;
	credits: number | null;
	durationMonths: number | null;
	siteKey: string | null;
	onSite: boolean;
	sitePosition: number;
	popular: boolean;
	isArchived: boolean;
};

/** A key that can sit in a link: lowercase words joined by single dashes ("start-to-align"). */
export function isSiteKey(key: string): boolean {
	return key.length <= 40 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key);
}

/** The cards she shows on the site, in her order (then by price). Archived ones and partner rates never show. */
export function siteCards(products: CardProduct[]): SiteCard[] {
	return products
		.filter((p) => p.kind === "membership" && p.onSite && !p.isArchived && !!p.siteKey && p.credits !== null)
		.sort((a, b) => a.sitePosition - b.sitePosition || Number(a.price) - Number(b.price))
		.map((p) => ({
			key: p.siteKey!,
			name: p.name,
			credits: p.credits!,
			months: p.durationMonths,
			price: Number(p.price),
			popular: p.popular,
		}));
}

export type SitePayload = {
	version: 1;
	generatedAt: string;
	/** Studio hours: the open days grouped by the same periods, with the words the site says them in. */
	hours: SiteHours;
	cards: SiteCard[];
	events: SiteEvent[];
};

/** Everything the website builds from: Studio hours and their words, the cards, and the outdoor events. */
export function sitePayload({
	hours,
	products,
	events = [],
	now,
}: {
	hours: WorkingHoursConfig;
	products: CardProduct[];
	events?: SiteEvent[];
	now: Date;
}): SitePayload {
	return {
		version: 1,
		generatedAt: now.toISOString(),
		hours: siteHours(hours),
		cards: siteCards(products),
		events,
	};
}
