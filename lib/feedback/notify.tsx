"use client";

import {
	buildErrorReport,
	errorReportMailto,
	formatErrorReport,
} from "@/lib/errors/report";

import { Danger, InfoCircle, TickCircle, Warning2 } from "iconsax-reactjs";
import { sileo } from "sileo";

const icons = {
	success: <TickCircle size={16} variant="Bold" />,
	error: <Danger size={16} variant="Bold" />,
	warning: <Warning2 size={16} variant="Bold" />,
	info: <InfoCircle size={16} variant="Bold" />,
};

// Copies the report and, when a developer address is configured, opens a
// prefilled email too: the clipboard still has it if the phone has no mail app.
async function sendReport(text: string, mailto: string | null) {
	let copied = true;
	try {
		await navigator.clipboard.writeText(text);
	} catch {
		copied = false;
	}
	if (mailto) {
		window.location.href = mailto;
		return;
	}
	if (copied) {
		sileo.success({
			title: "Report copied",
			description: "Paste it in your message to the developer.",
			icon: icons.success,
		});
	} else {
		sileo.warning({
			title: "Couldn't copy",
			description: "Send the developer the error code shown in the message.",
			icon: icons.warning,
		});
	}
}

// Long enough to read the code and tap the button.
const REPORT_TOAST_MS = 15_000;

type ErrorOptions = {
	description?: string;
	/** The `ref` a server action returned for an unexpected failure. */
	code?: string;
	/** A caught error, when the failure happened in the browser. */
	error?: unknown;
};

/** Every toast in the app goes through here, so they all look and read alike. */
export const notify = {
	success: (title: string, description?: string) =>
		sileo.success({ title, description, icon: icons.success }),

	info: (title: string, description?: string) =>
		sileo.info({ title, description, icon: icons.info }),

	warning: (title: string, description?: string, duration?: number | null) =>
		sileo.warning({ title, description, icon: icons.warning, duration }),

	/**
	 * A problem to show. Plain messages ("Enter a positive amount") stay
	 * short; unexpected failures (with a `code` or `error`) also carry the
	 * error code and a button that copies a full report for the developer.
	 */
	error: (title: string, { description, code, error }: ErrorOptions = {}) => {
		if (!code && !error) {
			return sileo.error({ title, description, icon: icons.error });
		}
		const report = buildErrorReport({ error: error ?? new Error(title), code });
		const mailto = errorReportMailto(report);
		return sileo.error({
			title,
			icon: icons.error,
			duration: REPORT_TOAST_MS,
			// Stay expanded the whole time: collapsed, the code and button are hidden.
			autopilot: { expand: 150, collapse: REPORT_TOAST_MS },
			// The toast itself is a <button>, so the description holds no links.
			description: (
				<span className="flex flex-col gap-1">
					{description ? <span>{description}</span> : null}
					<span className="font-mono text-xs opacity-70">
						Error code {report.code}
					</span>
				</span>
			),
			button: {
				title: mailto ? "Email report" : "Copy report",
				onClick: () => sendReport(formatErrorReport(report), mailto),
			},
		});
	},

	dismiss: (id: string) => sileo.dismiss(id),
};

/** Shows a failed action result (`{ error, ref }`), falling back to `message`. */
export function notifyActionError(
	result: { error?: string | null; ref?: string } | null | undefined,
	message: string,
) {
	return notify.error(result?.error || message, { code: result?.ref });
}
