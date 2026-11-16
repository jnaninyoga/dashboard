// The membership cards the website shows, and everything the site builds from.

import { type SiteEvent } from "@/lib/domain/events/rules";
import { type WorkingHoursConfig } from "@/lib/domain/schedule/hours";

import { type SiteHours, siteHours } from "./timetable";

/** The lines on a card, in French and English (null: the English site shows the French ones). */
export type CardLines = { fr: string[]; en: string[] | null };

/** A card on the website: its key in the site's links, its numbers, and the lines under its lotus. */
export type SiteCard = { key: string; name: string; credits: number; months: number | null; price: number; popular: boolean; lines: CardLines };

/**
 * The lines the site showed under each card before they came from here, by
 * key. A card she hasn't written lines for keeps them, so nothing disappears
 * when the site starts reading the dashboard.
 */
export const SITE_LINES_BEFORE: Record<string, CardLines> = {
	seance: {
		fr: ["Travailler l’ensemble du corps", "La respiration", "Explication sur le plan anatomique"],
		en: ["Working the whole body", "Breathing", "Anatomical explanations"],
	},
	"start-to-align": { fr: ["Suivi de progression", "Flexibilité de planning"], en: ["Progress tracking", "Flexible schedule"] },
	"graceful-reset": { fr: ["Plan adapté à vos progrès", "Suivi régulier"], en: ["A plan that follows your progress", "Regular follow-up"] },
	"flow-and-flourish": {
		fr: ["Accompagnement sur 9 mois", "Flexibilité des horaires", "Ateliers mensuels possibles"],
		en: ["Nine months of guidance", "Flexible times", "Monthly workshops possible"],
	},
	"elevate-and-evolve": {
		fr: ["Yoga personnalisé sur 12 mois", "Suivi et conseils sur mesure", "Ateliers mensuels (méditation, etc.)"],
		en: ["Personal yoga over 12 months", "Tailored follow-up and advice", "Monthly workshops (meditation and more)"],
	},
};

/** At most this many lines on a card, each this long: the card keeps its height in the row. */
export const MAX_CARD_LINES = 4;
export const MAX_CARD_LINE_LENGTH = 60;

/** Lines typed one per row: trimmed, empty rows dropped. */
export const cardLines = (text: string) =>
	text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);

/** What a card says on the site: her lines once she has written any, else the ones its key always had. */
export function linesOf(p: { siteKey: string | null; sitePointsFr: string[] | null; sitePointsEn: string[] | null }): CardLines {
	if (p.sitePointsFr === null) return (p.siteKey ? SITE_LINES_BEFORE[p.siteKey] : undefined) ?? { fr: [], en: null };
	return { fr: p.sitePointsFr, en: p.sitePointsEn?.length ? p.sitePointsEn : null };
}

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
	sitePointsFr: string[] | null;
	sitePointsEn: string[] | null;
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
			lines: linesOf(p),
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
