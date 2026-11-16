// Cloudflare Turnstile, the website form's check that a person is sending
// it. The website solves the challenge; the dashboard verifies the token.

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const ACTION = "booking";

/** Cloudflare's documented always-pass secret, accepted only outside production so local tests work. */
const TEST_SECRET = "1x0000000000000000000000000000000AA";

type Siteverify = {
	success?: boolean;
	action?: string;
	hostname?: string;
	"error-codes"?: string[];
};

/**
 * Whether the token proves a person sent the booking form on the website:
 * solved for the `booking` action, on one of the website's hostnames. A
 * token only works once.
 */
export async function verifyTurnstile(
	token: string,
	opts: { secret: string; remoteIp: string | null; hostnames: string[]; production: boolean },
	fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
	try {
		const res = await fetchImpl(SITEVERIFY, {
			method: "POST",
			headers: { "content-type": "application/x-www-form-urlencoded" },
			signal: AbortSignal.timeout(10_000),
			body: new URLSearchParams({
				secret: opts.secret,
				response: token,
				...(opts.remoteIp ? { remoteip: opts.remoteIp } : {}),
			}),
		});
		const out = (await res.json()) as Siteverify;
		if (out.success === true && !opts.production && opts.secret === TEST_SECRET) return true;
		if (out.success === true && out.action === ACTION && !!out.hostname && opts.hostnames.includes(out.hostname)) {
			return true;
		}
		console.error(
			"Turnstile refused the booking",
			JSON.stringify({ codes: out["error-codes"], action: out.action, hostname: out.hostname }),
		);
	} catch (error) {
		console.error("Turnstile unreachable", error);
	}
	return false;
}
