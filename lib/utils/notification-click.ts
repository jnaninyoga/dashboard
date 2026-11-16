// What tapping a booking notification does, kept out of the service worker
// so it can be tested. No imports: the service worker bundles this file.

type DashboardWindow = { url: string; focus(): Promise<unknown>; navigate(url: string): Promise<unknown> };

/**
 * Takes the dashboard she already has open to the booking; when there is
 * none, or the browser won't let the service worker steer it (a window it
 * doesn't control), opens the booking in a new one, so the tap always lands.
 */
export async function openFromNotification(
	windows: readonly DashboardWindow[],
	url: string,
	origin: string,
	openWindow: (url: string) => Promise<unknown>,
): Promise<void> {
	const open = windows.find((client) => new URL(client.url).origin === origin);
	if (open) {
		try {
			await open.focus();
			await open.navigate(url);
			return;
		} catch {
			// Fall through to a new window.
		}
	}
	await openWindow(url);
}
