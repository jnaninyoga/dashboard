/** The browsers' push services: Chrome and Edge (Google, Microsoft), Safari (Apple), Firefox (Mozilla). */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^(.+\.)?push\.apple\.com$/, /^(.+\.)?push\.services\.mozilla\.com$/, /^(.+\.)?notify\.windows\.com$/];

/**
 * Whether a subscription's endpoint is a real push service. The server posts
 * to it, so anything else (a private address, a site of someone's choosing)
 * is refused.
 */
export function isPushServiceEndpoint(endpoint: string): boolean {
	let url: URL;
	try {
		url = new URL(endpoint);
	} catch {
		return false;
	}
	return url.protocol === "https:" && PUSH_HOSTS.some((host) => host.test(url.hostname));
}

/** A VAPID public key (URL-safe base64) as the bytes `pushManager.subscribe` wants. */
export function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
	const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
	const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
	const raw = atob(base64);
	const bytes = new Uint8Array(new ArrayBuffer(raw.length));
	for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
	return bytes;
}
