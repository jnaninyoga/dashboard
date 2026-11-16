import { describe, expect, it } from "vitest";

import { hashIp } from "./ip";
import { verifyTurnstile } from "./turnstile";

const reply = (body: object) => (async () => new Response(JSON.stringify(body))) as unknown as typeof fetch;
const opts = { secret: "s", remoteIp: null, hostnames: ["jnaninyoga.com"], production: true };

describe("verifyTurnstile", () => {
	it("passes a real check", async () => {
		expect(await verifyTurnstile("t", opts, reply({ success: true, action: "booking", hostname: "jnaninyoga.com" }))).toBe(true);
	});

	it("refuses another action or host", async () => {
		expect(await verifyTurnstile("t", opts, reply({ success: true, action: "login", hostname: "jnaninyoga.com" }))).toBe(false);
		expect(await verifyTurnstile("t", opts, reply({ success: true, action: "booking", hostname: "evil.example" }))).toBe(false);
	});

	it("refuses a failed check", async () => {
		expect(await verifyTurnstile("t", opts, reply({ success: false, "error-codes": ["invalid-input-response"] }))).toBe(false);
	});

	it("refuses when Cloudflare can't be reached", async () => {
		const down = (async () => {
			throw new Error("down");
		}) as unknown as typeof fetch;
		expect(await verifyTurnstile("t", opts, down)).toBe(false);
	});

	it("lets the test secret through outside production only", async () => {
		const test = { ...opts, secret: "1x0000000000000000000000000000000AA" };
		expect(await verifyTurnstile("t", { ...test, production: false }, reply({ success: true }))).toBe(true);
		expect(await verifyTurnstile("t", test, reply({ success: true }))).toBe(false);
	});
});

describe("hashIp", () => {
	it("hides the address and is stable for one secret", () => {
		const hash = hashIp("41.1.2.3", "secret");
		expect(hash).toMatch(/^[0-9a-f]{64}$/);
		expect(hash).not.toContain("41.1.2.3");
		expect(hashIp("41.1.2.3", "secret")).toBe(hash);
		expect(hashIp("41.1.2.3", "other")).not.toBe(hash);
	});
});
