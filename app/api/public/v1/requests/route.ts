import { after } from "next/server";

import { DUPLICATE_WINDOW_MINUTES, findDuplicate, newRequestRef, parseSubmission, RATE_LIMIT } from "@/lib/domain/requests/submission";
import { logServerError } from "@/lib/errors/server";
import { notifyNewRequest } from "@/lib/notifications";
import { countRecentFromIp, matchClientId, recentRequests, saveRequest } from "@/lib/requests/store";
import { clientIp, hashIp } from "@/lib/website/ip";
import { corsHeaders, websiteHostnames, websiteOrigins } from "@/lib/website/origins";
import { verifyTurnstile } from "@/lib/website/turnstile";

/**
 * Bookings from the website's form (jnaninyoga.com). One of the dashboard's
 * few signed-out doors, so everything a stranger sends is checked here:
 * the website's origin, a honeypot and fill time, Turnstile, and a limit per
 * connection. A booking is saved before anyone is notified, so a failed
 * email or phone notification never loses it.
 */

const json = (body: unknown, status: number, headers: Record<string, string> | null) =>
	Response.json(body, { status, headers: headers ?? undefined });

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000);

export async function OPTIONS(request: Request) {
	const cors = corsHeaders(request.headers.get("origin"));
	return cors ? new Response(null, { status: 204, headers: cors }) : new Response(null, { status: 403 });
}

export async function POST(request: Request) {
	// Browsers always send Origin on a cross-site POST: other sites can't drive visitors' browsers at this form.
	const cors = corsHeaders(request.headers.get("origin"));
	if (!cors) return json({ error: "forbidden" }, 403, null);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: "invalid_json" }, 400, cors);
	}

	// Bots learn nothing: they're told it worked.
	const parsed = parseSubmission(body);
	if (parsed.outcome === "bot") return json({ ok: true }, 200, cors);
	if (parsed.outcome === "invalid") return json({ error: "invalid", fields: parsed.fields }, 422, cors);
	const submission = parsed.submission;

	const secret = process.env.TURNSTILE_SECRET;
	if (!secret) return json({ error: "not_configured" }, 503, cors);

	try {
		const ip = clientIp(request.headers);
		const ipHash = hashIp(ip ?? "unknown", process.env.BETTER_AUTH_SECRET ?? secret);
		if ((await countRecentFromIp(ipHash, minutesAgo(RATE_LIMIT.windowMinutes))) >= RATE_LIMIT.max) {
			return json({ error: "too_many" }, 429, cors);
		}

		// A token only works once, so it is spent after the cheap checks.
		const human = await verifyTurnstile(submission.token, {
			secret,
			remoteIp: ip,
			hostnames: websiteHostnames(websiteOrigins()),
			production: process.env.NODE_ENV === "production",
		});
		if (!human) return json({ error: "not_verified" }, 403, cors);

		// The same booking sent again (a double tap, a retry after a lost answer) is the first one.
		const repeat = findDuplicate(await recentRequests(minutesAgo(DUPLICATE_WINDOW_MINUTES)), submission, new Date());
		if (repeat) return json({ ok: true, ref: repeat.ref }, 200, cors);

		const saved = await saveRequest({
			ref: newRequestRef(),
			kind: submission.kind,
			choiceKey: submission.choiceKey,
			choiceLabel: submission.choiceLabel,
			name: submission.name,
			phone: submission.phone,
			message: submission.message,
			lang: submission.lang,
			clientId: await matchClientId(submission.phone),
			ipHash,
		});

		after(() => notifyNewRequest(saved));
		return json({ ok: true, ref: saved.ref }, 200, cors);
	} catch (error) {
		return json({ error: "save_failed", ref: logServerError("Saving a website booking", error) }, 500, cors);
	}
}
