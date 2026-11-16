import { createHmac } from "node:crypto";

/**
 * A keyed hash of the sender's address: enough to count how often one
 * connection books, without keeping the address itself.
 */
export function hashIp(ip: string, secret: string): string {
	return createHmac("sha256", secret).update(`booking-ip:${ip}`).digest("hex");
}

/** The visitor's address as Vercel passes it on, or null when there's none (local tests). */
export function clientIp(headers: Headers): string | null {
	const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
	return forwarded || headers.get("x-real-ip")?.trim() || null;
}
