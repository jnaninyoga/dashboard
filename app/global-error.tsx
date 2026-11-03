"use client";

import { ErrorScreen } from "@/components/feedback/error-screen";

import "./globals.css";

// Last resort when the root layout itself fails: it replaces the whole
// document, so it renders its own <html> and <body>.
export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="en">
			<body className="bg-background font-sans antialiased">
				<ErrorScreen error={error} reset={reset} fullScreen />
			</body>
		</html>
	);
}
