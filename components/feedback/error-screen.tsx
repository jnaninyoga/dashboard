"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { LotusPond } from "@/components/ui/lotus-pond";
import {
	buildErrorReport,
	errorReportMailto,
	formatErrorReport,
} from "@/lib/errors/report";
import { cn } from "@/lib/utils/ui";

import { Copy, CopySuccess, Refresh2, Sms } from "iconsax-reactjs";

const noop = () => () => {};

type ErrorScreenProps = {
	error: Error & { digest?: string };
	reset: () => void;
	/** Covers the whole window (global error). Otherwise it fills the page
	 *  area and the sidebar stays usable. */
	fullScreen?: boolean;
};

/**
 * What the operator sees when a page breaks: calm, with one clear way forward,
 * and a report she can copy or email so the developer can find the cause.
 */
export function ErrorScreen({ error, reset, fullScreen = false }: ErrorScreenProps) {
	// The report reads the URL and device and mints a code, so it is only
	// built in the browser; the server render shows the digest, if any.
	const inBrowser = useSyncExternalStore(noop, () => true, () => false);
	const report = useMemo(
		() => (inBrowser ? buildErrorReport({ error }) : null),
		[inBrowser, error],
	);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (report) console.error(`[${report.code}] Page error:`, error);
	}, [report, error]);

	const code = report?.code ?? error.digest;
	const mailto = report ? errorReportMailto(report) : null;
	// A response cut off mid-way (weak signal, server restart): Firefox says
	// "Error in input stream", Chrome "Failed to fetch", Safari "Load failed".
	const lostConnection = /input stream|failed to fetch|load failed|networkerror|network error/i.test(
		error.message,
	);

	const copy = async () => {
		if (!report) return;
		try {
			await navigator.clipboard.writeText(formatErrorReport(report));
			setCopied(true);
			setTimeout(() => setCopied(false), 2500);
		} catch {
			// Clipboard blocked: the code stays on screen to read out instead.
		}
	};

	return (
		<div
			role="alert"
			// In the dashboard, the scene takes the page's whole area, past the gutter.
			data-full-bleed
			className={cn(
				"relative flex w-full items-center justify-center overflow-hidden px-5 py-10",
				fullScreen ? "fixed inset-0 z-100 min-h-dvh bg-background" : "min-h-[70vh] flex-1",
			)}
		>
			<LotusPond />

			<div className="relative z-10 flex w-full max-w-md animate-slide-up flex-col items-center gap-6 text-center">
				<div className="space-y-3">
					<h1 className="font-heading text-4xl font-bold text-foreground sm:text-5xl">
						Something drifted away
					</h1>
					<p className="leading-relaxed text-muted-foreground">
						{lostConnection
							? "The page stopped loading halfway: the connection or the server dropped. What you saved is safe. Try again; if it keeps happening, send the report below to your developer."
							: "This page ran into a problem. What you saved is safe. Try again, and if it keeps happening, send the report below to your developer."}
					</p>
				</div>

				{code ? (
					<div className="zen-shadow flex flex-col items-center rounded-2xl border bg-card px-6 py-3">
						<span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
							Error code
						</span>
						<span className="font-mono text-lg font-bold tracking-wider select-all">
							{code}
						</span>
					</div>
				) : null}

				<Button
					onClick={() => reset()}
					className="zen-glow-teal h-14 w-full max-w-xs gap-3 rounded-2xl text-base font-semibold"
				>
					<Refresh2 size={22} variant="Bold" />
					Try again
				</Button>

				<div className="flex w-full max-w-xs flex-wrap justify-center gap-2">
					<Button
						variant="outline"
						onClick={copy}
						disabled={!report}
						className="h-11 flex-1 gap-2 rounded-xl"
					>
						{copied ? <CopySuccess size={18} /> : <Copy size={18} />}
						{copied ? "Copied" : "Copy report"}
					</Button>
					{mailto ? (
						<Button variant="outline" asChild className="h-11 flex-1 gap-2 rounded-xl">
							<a href={mailto}>
								<Sms size={18} />
								Email developer
							</a>
						</Button>
					) : null}
				</div>

				{report ? (
					<details className="w-full text-left">
						<summary className="cursor-pointer text-center text-xs font-medium text-muted-foreground">
							Technical details
						</summary>
						<pre className="mt-3 max-h-56 overflow-auto rounded-xl bg-muted/60 p-3 text-[11px] leading-relaxed whitespace-pre-wrap">
							{formatErrorReport(report)}
						</pre>
					</details>
				) : null}

				<p className="max-w-sm font-vibes text-xl text-muted-foreground/60">
					In the midst of movement and chaos, keep stillness inside of you.
				</p>
			</div>
		</div>
	);
}
