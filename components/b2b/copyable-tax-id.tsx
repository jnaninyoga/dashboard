"use client";

import { useState } from "react";

import { cn } from "@/lib/utils/ui";

import { Copy, TickCircle } from "iconsax-reactjs";

/**
 * A partner's ICE (tax id) as a line of text, like the address beside it,
 * so it lines up with the name above instead of sitting in a pill. The
 * whole line copies it (a bigger target than a lone icon); the icon turns
 * into a tick for two seconds.
 */
export function CopyableTaxId({
	taxId,
	label = true,
	className,
}: {
	taxId: string;
	/** "ICE " before the number; off where a column heading already says it. */
	label?: boolean;
	className?: string;
}) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(taxId);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy text: ", err);
		}
	};

	return (
		<button
			type="button"
			onClick={handleCopy}
			aria-label={copied ? `ICE ${taxId} copied` : `Copy ICE ${taxId}`}
			title="Copy ICE"
			className={cn(
				"group/ice inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md text-left text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
				className,
			)}
		>
			<span className="truncate tabular-nums">{label ? `ICE ${taxId}` : taxId}</span>
			{copied ? (
				<TickCircle size={14} variant="Bold" className="shrink-0 text-primary" aria-hidden />
			) : (
				<Copy size={14} className="shrink-0 opacity-60 transition-opacity group-hover/ice:opacity-100" aria-hidden />
			)}
			<span aria-live="polite" className="sr-only">
				{copied ? "Copied" : ""}
			</span>
		</button>
	);
}
