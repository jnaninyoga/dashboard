"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { getNewRequestCount } from "@/lib/actions/requests/queries";

const NewRequestsContext = createContext(0);

/**
 * How many website bookings wait for her answer, for the sidebar and the
 * phone's bottom bar. The layout gives the count at load; it's read again
 * whenever she comes back to the dashboard (the app reopened, the tab
 * focused), since a booking can arrive while it sits in the background.
 */
export function NewRequestsProvider({
	initial,
	refresh = true,
	children,
}: {
	initial: number;
	/** Off where nobody is signed in (the dev playground): reading the count needs a session. */
	refresh?: boolean;
	children: React.ReactNode;
}) {
	const [count, setCount] = useState(initial);
	const [seen, setSeen] = useState(initial);

	// A fresh count from the server (after she confirms one, say) wins.
	if (initial !== seen) {
		setSeen(initial);
		setCount(initial);
	}

	useEffect(() => {
		if (!refresh) return;
		let live = true;
		const reread = () => {
			if (document.visibilityState !== "visible") return;
			getNewRequestCount()
				.then((next) => live && setCount(next))
				.catch(() => undefined);
		};
		document.addEventListener("visibilitychange", reread);
		window.addEventListener("focus", reread);
		return () => {
			live = false;
			document.removeEventListener("visibilitychange", reread);
			window.removeEventListener("focus", reread);
		};
	}, [refresh]);

	return <NewRequestsContext value={count}>{children}</NewRequestsContext>;
}

export function useNewRequests(): number {
	return useContext(NewRequestsContext);
}

/** "3 new requests", for a badge's screen-reader label. */
export function newRequestsLabel(count: number): string {
	return `${count} new ${count === 1 ? "request" : "requests"}`;
}
