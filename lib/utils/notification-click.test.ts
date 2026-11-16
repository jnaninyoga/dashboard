import { describe, expect, it, vi } from "vitest";

import { openFromNotification } from "./notification-click";

const origin = "https://dash.jnaninyoga.com";
const url = `${origin}/bookings/abc`;

const win = (navigate: () => Promise<unknown>) => ({ url: `${origin}/`, focus: vi.fn(async () => undefined), navigate: vi.fn(navigate) });

describe("openFromNotification", () => {
	it("takes the open dashboard to the booking", async () => {
		const open = win(async () => undefined);
		const openWindow = vi.fn(async () => null);
		await openFromNotification([open], url, origin, openWindow);
		expect(open.navigate).toHaveBeenCalledWith(url);
		expect(openWindow).not.toHaveBeenCalled();
	});

	it("opens the booking when the open window can't be steered", async () => {
		const stuck = win(async () => {
			throw new TypeError("This service worker is not the client's active service worker.");
		});
		const openWindow = vi.fn(async () => null);
		await openFromNotification([stuck], url, origin, openWindow);
		expect(openWindow).toHaveBeenCalledWith(url);
	});

	it("opens the booking when the dashboard isn't open", async () => {
		const openWindow = vi.fn(async () => null);
		await openFromNotification([{ ...win(async () => undefined), url: "https://example.com/" }], url, origin, openWindow);
		expect(openWindow).toHaveBeenCalledWith(url);
	});
});
