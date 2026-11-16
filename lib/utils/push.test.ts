import { describe, expect, it } from "vitest";

import { urlBase64ToUint8Array } from "./push";

describe("urlBase64ToUint8Array", () => {
	it("decodes a VAPID key", () => {
		expect(Array.from(urlBase64ToUint8Array("AQID_-8"))).toEqual([1, 2, 3, 255, 239]);
	});

	it("decodes a key that needs padding", () => {
		expect(Array.from(urlBase64ToUint8Array("AQ"))).toEqual([1]);
	});
});
