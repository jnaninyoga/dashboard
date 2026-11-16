// A booking sent from the website's form, checked before it is saved. The
// rules are the ones the website's own booking function used, so a visitor
// sees the same behaviour now that the dashboard receives the form.

import { MAX_PARTY } from "@/lib/domain/events/rules";

import { phoneKey } from "./phone";

export type RequestKind = "card" | "class" | "event" | "other";
export type SiteLang = "fr" | "en";

export type Submission = {
	name: string;
	phone: string;
	kind: RequestKind;
	/** The website's id for the choice: a card ("start-to-align") or a class time ("8h30"). */
	choiceKey: string | null;
	/** The choice as the visitor read it ("Start To Align (1 500 Dh)"). */
	choiceLabel: string;
	message: string | null;
	lang: SiteLang;
	token: string;
	/** How many people an event booking is for (1 otherwise). */
	partySize: number;
};

export type SubmissionResult =
	| { outcome: "bot" }
	| { outcome: "invalid"; fields: Partial<Record<"name" | "phone", "too_short" | "invalid">> }
	| { outcome: "ok"; submission: Submission };

/** A real person takes a few seconds to fill the form, and doesn't leave it open for a week. */
const MIN_FILL_MS = 2500;
const MAX_FILL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_TOKEN = 2048;

/** The same booking sent again (a double tap, a retry) within this time is the first one. */
export const DUPLICATE_WINDOW_MINUTES = 10;

/** How many bookings one connection may send in a window, to slow down floods. */
export const RATE_LIMIT = { max: 5, windowMinutes: 10 } as const;

const clip = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/** "plan:start-to-align" is a card, "slot:8h30" a class time, "event:<slug>" an outdoor event; anything else is open. */
function readChoice(value: unknown): { kind: RequestKind; choiceKey: string | null } {
	const raw = clip(value, 160);
	const [prefix, ...rest] = raw.split(":");
	const key = rest.join(":").trim();
	if (key && prefix === "plan") return { kind: "card", choiceKey: key };
	if (key && prefix === "slot") return { kind: "class", choiceKey: key };
	if (key && prefix === "event") return { kind: "event", choiceKey: key };
	return { kind: "other", choiceKey: null };
}

/**
 * Reads the form's body. Bots learn nothing: a filled honeypot, or a fill
 * time that is missing, instant or absurd, comes back as `bot`, and the
 * caller answers as if it had worked.
 */
export function parseSubmission(body: unknown): SubmissionResult {
	if (typeof body !== "object" || body === null || Array.isArray(body)) return { outcome: "bot" };
	const data = body as Record<string, unknown>;

	const filledMs = typeof data.filledMs === "number" ? data.filledMs : Number.NaN;
	if (clip(data.website, 200) || !(filledMs >= MIN_FILL_MS && filledMs <= MAX_FILL_MS)) return { outcome: "bot" };

	const name = clip(data.name, 120);
	const phone = clip(data.phone, 40);
	const fields: Partial<Record<"name" | "phone", "too_short" | "invalid">> = {};
	if (name.length < 2) fields.name = "too_short";
	if (phone.replace(/\D/g, "").length < 8) fields.phone = "invalid";
	if (Object.keys(fields).length) return { outcome: "invalid", fields };

	const message = clip(data.message, 2000);
	const token = typeof data.token === "string" && data.token.length <= MAX_TOKEN ? data.token : "";

	const choice = readChoice(data.choiceKey);
	const asked = Math.floor(Number(data.partySize));
	const partySize = choice.kind === "event" && Number.isFinite(asked) && asked >= 1 ? Math.min(asked, MAX_PARTY) : 1;

	return {
		outcome: "ok",
		submission: {
			name,
			phone,
			...choice,
			choiceLabel: clip(data.choice, 160) || "—",
			message: message || null,
			lang: clip(data.lang, 5) === "en" ? "en" : "fr",
			token,
			partySize,
		},
	};
}

/** The code a visitor and Ouarda can both quote: "WEB-1A2B3C4D". */
export function newRequestRef(): string {
	return `WEB-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

/** Spacing and case don't make a resend a different booking. */
const same = (a: string | null, b: string | null) =>
	(a ?? "").trim().replace(/\s+/g, " ").toLowerCase() === (b ?? "").trim().replace(/\s+/g, " ").toLowerCase();

/**
 * The earlier request this one repeats: the same booking sent again (a
 * double tap, a retry after a lost answer) within the window. Only an
 * identical resend counts: a second question, or a booking for someone else
 * from the same phone, is a new request and must reach her.
 */
export function findDuplicate<
	T extends { phone: string; name: string; choiceLabel: string; message: string | null; createdAt: Date },
>(
	recent: T[],
	submission: { phone: string; name: string; choiceLabel: string; message: string | null },
	now: Date,
): T | null {
	const key = phoneKey(submission.phone);
	if (!key) return null;
	const since = now.getTime() - DUPLICATE_WINDOW_MINUTES * 60 * 1000;
	return (
		recent.find(
			(request) =>
				request.createdAt.getTime() >= since &&
				request.choiceLabel === submission.choiceLabel &&
				same(request.name, submission.name) &&
				same(request.message, submission.message) &&
				phoneKey(request.phone) === key,
		) ?? null
	);
}
