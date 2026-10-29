import { STUDIO_TIME_ZONE } from "@/lib/utils/time";

/** Everything the developer needs from a failure, in one copyable block. */
export type ErrorReport = {
	code: string;
	message: string;
	page: string;
	time: string;
	version: string;
	device: string;
	stack?: string;
};

// No 0/O or 1/I/L, so a code survives being read aloud over the phone.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function newErrorCode(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(6));
	return `JY-${Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("")}`;
}

/**
 * `code` is the reference the server logged the failure under (or Next's
 * digest for render errors); when there is none, a fresh one is minted.
 */
export function buildErrorReport({
	error,
	code,
}: {
	error: unknown;
	code?: string;
}): ErrorReport {
	const err = error instanceof Error ? error : new Error(String(error));
	const digest = (err as Error & { digest?: string }).digest;
	const inBrowser = typeof window !== "undefined";

	return {
		code: code ?? digest ?? newErrorCode(),
		message: err.message || "Unknown error",
		page: inBrowser ? window.location.pathname + window.location.search : "",
		// The UTC stamp is exact whatever the browser's tz data says (some still
		// put Marrakech at UTC+1), and it's what server logs use.
		time: `${new Date().toLocaleString("en-GB", { timeZone: STUDIO_TIME_ZONE })} Marrakech (${new Date().toISOString().slice(0, 19).replace("T", " ")} UTC)`,
		version: process.env.NEXT_PUBLIC_APP_VERSION || "dev",
		device: inBrowser ? navigator.userAgent : "",
		stack: err.stack?.split("\n").slice(0, 12).join("\n"),
	};
}

export function formatErrorReport(report: ErrorReport): string {
	return [
		`Error code: ${report.code}`,
		`What happened: ${report.message}`,
		`Page: ${report.page}`,
		`When: ${report.time}`,
		`App version: ${report.version}`,
		`Device: ${report.device}`,
		report.stack ? `\nTrace:\n${report.stack}` : "",
	]
		.filter(Boolean)
		.join("\n");
}

/** A prefilled email to the developer, or null when no address is configured. */
export function errorReportMailto(report: ErrorReport): string | null {
	const to = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
	if (!to) return null;
	// Mail clients truncate long mailto: links; the trace is the first to go.
	const body = formatErrorReport(report).slice(0, 1800);
	const subject = `Command Center error ${report.code}`;
	return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
