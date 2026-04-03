"use client";

import { useEffect, useRef } from "react";

import { toast } from "sonner";

export function OfflineDetector() {
	const toastId = useRef<string | number | null>(null);

	useEffect(() => {
		const handleOffline = () => {
			// Dismiss any previous reconnection toast
			if (toastId.current) toast.dismiss(toastId.current);

			toastId.current = toast.error("You are offline", {
				description: "Waiting for connection to restore…",
				duration: Infinity,
				id: "offline-toast",
			});
		};

		const handleOnline = () => {
			// Dismiss the offline toast
			if (toastId.current) {
				toast.dismiss(toastId.current);
				toastId.current = null;
			}

			toast.success("Back online", {
				description: "Connection restored.",
				duration: 3000,
			});
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
