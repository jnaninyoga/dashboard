import { describe, expect, it } from "vitest";

import { isPushServiceEndpoint, urlBase64ToUint8Array } from "./push";

describe("isPushServiceEndpoint", () => {
	it.each([
		"https://fcm.googleapis.com/fcm/send/abc",
		"https://web.push.apple.com/QGx",
		"https://updates.push.services.mozilla.com/wpush/v2/abc",
		"https://wns2-par02p.notify.windows.com/w/?token=abc",
	])("accepts the browsers' push services: %s", (url) => {
		expect(isPushServiceEndpoint(url)).toBe(true);
	});

	it.each([
		"http://fcm.googleapis.com/fcm/send/abc",
		"https://127.0.0.1/hook",
		"https://169.254.169.254/latest/meta-data",
		"https://localhost/push",
		"https://evil.example/fcm.googleapis.com",
		"https://fcm.googleapis.com.evil.example/x",
		"not a url",
	])("refuses anything else: %s", (url) => {
		expect(isPushServiceEndpoint(url)).toBe(false);
	});
});

describe("urlBase64ToUint8Array", () => {
	it("decodes a VAPID key", () => {
		expect(Array.from(urlBase64ToUint8Array("AQID_-8"))).toEqual([1, 2, 3, 255, 239]);
	});

	it("decodes a key that needs padding", () => {
		expect(Array.from(urlBase64ToUint8Array("AQ"))).toEqual([1]);
	});
});
