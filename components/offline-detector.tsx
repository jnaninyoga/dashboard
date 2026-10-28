"use client";

import { useEffect, useRef } from "react";

import { notify } from "@/lib/feedback/notify";

export function OfflineDetector() {
	const toastId = useRef<string | null>(null);

	useEffect(() => {
		const handleOffline = () => {
			// Dismiss any previous reconnection toast
			if (toastId.current) notify.dismiss(toastId.current);

			// Stays up (no timeout) until the connection comes back.
			toastId.current = notify.warning(
				"You are offline",
				"Waiting for connection to restore…",
				null,
			);
		};

		const handleOnline = () => {
			// Dismiss the offline toast
			if (toastId.current) {
				notify.dismiss(toastId.current);
				toastId.current = null;
			}

			notify.success("Back online", "Connection restored.");
		};

		// Check initial state
		if (!navigator.onLine) {
			handleOffline();
		}

		window.addEventListener("offline", handleOffline);
		window.addEventListener("online", handleOnline);

		return () => {
			window.removeEventListener("offline", handleOffline);
			window.removeEventListener("online", handleOnline);
		};
	}, []);

	return null;
}
