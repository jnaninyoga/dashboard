"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils/ui";

import { Danger, InfoCircle, Warning2 } from "iconsax-reactjs";

type Tone = "error" | "warning" | "info";

export type DocumentNotice = {
	id: string;
	tone: Tone;
	message: React.ReactNode;
	/** A way to deal with it: "Add a contact", "Retry", "Show"… */
	action?: React.ReactNode;
};

// Two contexts: the setter never changes, so a part of the page publishing
// a notice isn't re-run (and doesn't publish again) each time the list does.
const SetNoticeContext = createContext<((id: string, notice: DocumentNotice | null) => void) | null>(null);
const NoticesListContext = createContext<DocumentNotice[]>([]);

/** Collects the notices of a document's page, from wherever they arise (lines, notes, actions). */
export function NoticesProvider({ children }: { children: React.ReactNode }) {
	const [byId, setById] = useState<Record<string, DocumentNotice>>({});
	const setNotice = useCallback((id: string, notice: DocumentNotice | null) => {
		setById((current) => {
			if (notice) return { ...current, [id]: notice };
			if (!(id in current)) return current;
			const { [id]: _removed, ...rest } = current;
			return rest;
		});
	}, []);
	const notices = useMemo(() => Object.values(byId), [byId]);
	return (
		<SetNoticeContext.Provider value={setNotice}>
			<NoticesListContext.Provider value={notices}>{children}</NoticesListContext.Provider>
		</SetNoticeContext.Provider>
	);
}

/**
 * Shows a notice in the page's notice area while `notice` isn't null. `key`
 * says when it changed (its words); the notice as it is then is shown.
 */
export function useNotice(id: string, notice: Omit<DocumentNotice, "id"> | null, key: string) {
	const setNotice = useContext(SetNoticeContext);
	const latest = useRef(notice);
	useEffect(() => {
		latest.current = notice;
	});
	useEffect(() => {
		setNotice?.(id, latest.current ? { id, ...latest.current } : null);
	}, [setNotice, id, key]);
	useEffect(() => () => setNotice?.(id, null), [setNotice, id]);
}

const ORDER: Record<Tone, number> = { error: 0, warning: 1, info: 2 };

const TONES: Record<Tone, { box: string; icon: React.ReactNode }> = {
	error: {
		box: "border-destructive/25 bg-[color-mix(in_oklab,var(--destructive)_9%,var(--card))]",
		icon: <Danger size={20} variant="Bold" className="text-destructive" />,
	},
	warning: {
		box: "border-warning/25 bg-[color-mix(in_oklab,var(--warning)_9%,var(--card))]",
		icon: <Warning2 size={20} variant="Bold" className="text-warning" />,
	},
	info: {
		box: "border-info/20 bg-[color-mix(in_oklab,var(--info)_7%,var(--card))]",
		icon: <InfoCircle size={20} variant="Bold" className="text-info" />,
	},
};

/**
 * A document's notices in one place, kept in view at the top of the page:
 * errors first (what stops it), then warnings (what will matter), then
 * information. Nothing to say, nothing shown.
 */
export function DocumentNotices({ notices: local = [], className }: { notices?: DocumentNotice[]; className?: string }) {
	const shared = useContext(NoticesListContext);
	const notices = [...shared, ...local].sort((a, b) => ORDER[a.tone] - ORDER[b.tone]);
	if (!notices.length) return null;
	const blocking = notices.some((notice) => notice.tone === "error");

	return (
		// The page's own background behind the stack, so what scrolls under it
		// never shows between two notices. On a phone (little room, less with
		// the keyboard open) it stays in view only while something blocks her.
		<ul
			aria-label="Notices"
			aria-live="polite"
			className={cn(
				"top-14 z-30 -mt-2 flex flex-col gap-2 bg-background pt-2 pb-1",
				blocking ? "sticky" : "sm:sticky",
				className,
			)}
		>
			{notices.map((notice) => (
				<li
					key={notice.id}
					className={cn(
						"flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border px-4 py-2.5 text-sm text-foreground shadow-sm",
						TONES[notice.tone].box,
					)}
				>
					<span className="shrink-0" aria-hidden>
						{TONES[notice.tone].icon}
					</span>
					<span className="sr-only">{notice.tone === "error" ? "Error: " : notice.tone === "warning" ? "Warning: " : "Note: "}</span>
					<p className="min-w-0 flex-1">{notice.message}</p>
					{notice.action ? <div className="ml-auto shrink-0">{notice.action}</div> : null}
				</li>
			))}
		</ul>
	);
}

/** The small text button notices use for their action. */
export function NoticeAction({ className, ...props }: React.ComponentProps<"button">) {
	return (
		<button
			type="button"
			{...props}
			className={cn(
				"inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring",
				className,
			)}
		/>
	);
}
