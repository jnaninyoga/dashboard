"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils/ui";

import { Refresh, TickCircle, Warning2 } from "iconsax-reactjs";

import { useRegisterDraftFlush } from "./draft-save";

export type SaveResult = { ok: true } | { ok: false; message: string; invalid?: boolean };

type SaveState =
	| { kind: "saved" }
	| { kind: "saving" }
	| { kind: "invalid"; message: string }
	| { kind: "error"; message: string };

/**
 * Saves a part of a draft by itself: a moment after she stops typing, or
 * right away when an action asks (useFlushDraft). `save` reports what
 * happened; something not yet savable ("describe this line") waits and says
 * so, and a failure offers to retry. Leaving with unsaved changes asks first.
 */
export function useAutosave(save: () => Promise<SaveResult>, delay = 900) {
	const [state, setState] = useState<SaveState>({ kind: "saved" });
	const dirty = useRef(false);
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const running = useRef<Promise<boolean> | null>(null);
	// The latest save (it reads the latest values), kept after each render.
	const saveRef = useRef(save);
	useEffect(() => {
		saveRef.current = save;
	});
	const register = useRegisterDraftFlush();

	const run = useCallback(async (): Promise<boolean> => {
		clearTimeout(timer.current);
		if (running.current) await running.current;
		if (!dirty.current) return true;
		dirty.current = false;
		setState({ kind: "saving" });
		const job = saveRef.current().then((result) => {
			if (result.ok) {
				setState(dirty.current ? { kind: "saving" } : { kind: "saved" });
				return true;
			}
			dirty.current = true;
			setState(result.invalid ? { kind: "invalid", message: result.message } : { kind: "error", message: result.message });
			return false;
		});
		running.current = job;
		const ok = await job;
		running.current = null;
		return ok;
	}, []);

	/** Something changed: save it in a moment. */
	const changed = useCallback(() => {
		dirty.current = true;
		setState({ kind: "saving" });
		clearTimeout(timer.current);
		timer.current = setTimeout(() => void run(), delay);
	}, [delay, run]);

	useEffect(() => register?.(run), [register, run]);

	useEffect(() => {
		const warn = (event: BeforeUnloadEvent) => {
			if (dirty.current || running.current) event.preventDefault();
		};
		window.addEventListener("beforeunload", warn);
		return () => window.removeEventListener("beforeunload", warn);
	}, []);

	return { state, changed, retry: run };
}

/** Where saving stands, in a word: Saved, Saving…, or what's stopping it. */
export function SaveStatus({
	state,
	retry,
	className,
}: {
	state: ReturnType<typeof useAutosave>["state"];
	retry: () => void;
	className?: string;
}) {
	const problem = state.kind === "invalid" || state.kind === "error";
	return (
		<p
			role="status"
			className={cn(
				"flex items-center gap-1.5 text-sm",
				problem ? "text-destructive" : "text-muted-foreground",
				className,
			)}
		>
			{state.kind === "saved" ? (
				<>
					<TickCircle size={16} variant="Bold" className="text-success" /> Saved
				</>
			) : state.kind === "saving" ? (
				<>
					<Refresh size={16} className="animate-spin" /> Saving…
				</>
			) : (
				<>
					<Warning2 size={16} variant="Bold" /> Not saved: {state.message}
					{state.kind === "error" ? (
						<button type="button" onClick={() => void retry()} className="ml-1 font-semibold underline">
							Retry
						</button>
					) : null}
				</>
			)}
		</p>
	);
}
