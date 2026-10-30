"use client";

import { createContext, useCallback, useContext, useRef } from "react";

type Flush = () => Promise<boolean>;

const DraftSaveContext = createContext<{ register: (flush: Flush) => () => void; flush: Flush } | null>(null);

/**
 * Lets a draft's actions (send it, download its PDF) wait until what she
 * just typed (lines, notes) is saved, so nothing acts on an older version.
 */
export function DraftSaveProvider({ children }: { children: React.ReactNode }) {
	const flushes = useRef(new Set<Flush>());
	const register = useCallback((flush: Flush) => {
		flushes.current.add(flush);
		return () => {
			flushes.current.delete(flush);
		};
	}, []);
	const flush = useCallback(async () => {
		const results = await Promise.all([...flushes.current].map((f) => f()));
		return results.every(Boolean);
	}, []);
	return <DraftSaveContext.Provider value={{ register, flush }}>{children}</DraftSaveContext.Provider>;
}

/** Saves whatever is pending on the draft; true once everything is saved (or nothing was). */
export function useFlushDraft(): Flush {
	return useContext(DraftSaveContext)?.flush ?? (async () => true);
}

/** For an autosaving part of the draft: offers its flush to the actions around it. */
export function useRegisterDraftFlush() {
	return useContext(DraftSaveContext)?.register;
}
