import { describe, expect, it } from "vitest";

import { isAllowedUser } from "./allowlist";

const verified = (email: string) => ({ email, emailVerified: true });

describe("isAllowedUser", () => {
	it("lets in an email on the list", () => {
		expect(isAllowedUser(verified("studio@example.com"), "studio@example.com")).toBe(true);
	});

	it("finds an email anywhere in a list of several", () => {
		expect(isAllowedUser(verified("dev@example.com"), "studio@example.com,dev@example.com")).toBe(true);
	});

	it("ignores capitals and the spaces around each email", () => {
		expect(isAllowedUser(verified("Studio@Example.com"), " dev@example.com , STUDIO@example.com ")).toBe(true);
	});

	it("refuses an email that isn't on the list", () => {
		expect(isAllowedUser(verified("stranger@example.com"), "studio@example.com")).toBe(false);
	});

	it("lets nobody in when the list is empty", () => {
		expect(isAllowedUser(verified("studio@example.com"), "")).toBe(false);
	});

	it("lets nobody in when the list isn't set", () => {
		expect(isAllowedUser(verified("studio@example.com"), undefined)).toBe(false);
	});

	it("isn't fooled by stray commas in the list", () => {
		expect(isAllowedUser(verified(""), "studio@example.com,,")).toBe(false);
	});

	it("refuses an email Google hasn't verified, even on the list", () => {
		expect(isAllowedUser({ email: "studio@example.com", emailVerified: false }, "studio@example.com")).toBe(false);
	});

	it("doesn't match part of an address", () => {
		expect(isAllowedUser(verified("studio@example.com.evil.net"), "studio@example.com")).toBe(false);
		expect(isAllowedUser(verified("xstudio@example.com"), "studio@example.com")).toBe(false);
	});
});
