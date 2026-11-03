import { describe, expect, it } from "vitest";

import {
	classifyRefreshFailure,
	GOOGLE_UNAVAILABLE,
	googleErrorMessage,
	isGoogleAccessError,
	needsReauth,
	REAUTH_REQUIRED,
} from "./errors";

describe("classifyRefreshFailure", () => {
	it("asks for a new sign-in only when Google refuses the refresh token", () => {
		expect(classifyRefreshFailure(400, '{"error":"invalid_grant"}')).toBe(REAUTH_REQUIRED);
		expect(classifyRefreshFailure(401, '{"error":"invalid_grant"}')).toBe(REAUTH_REQUIRED);
	});

	it("treats bad requests, our own credentials and outages as temporary", () => {
		expect(classifyRefreshFailure(400, '{"error":"invalid_request"}')).toBe(GOOGLE_UNAVAILABLE);
		expect(classifyRefreshFailure(401, '{"error":"invalid_client"}')).toBe(GOOGLE_UNAVAILABLE);
		expect(classifyRefreshFailure(429, "")).toBe(GOOGLE_UNAVAILABLE);
		expect(classifyRefreshFailure(503, "invalid_grant")).toBe(GOOGLE_UNAVAILABLE);
	});
});

describe("telling Google's failures from ours", () => {
	it("recognises only the two Google access errors", () => {
		expect(isGoogleAccessError(new Error(REAUTH_REQUIRED))).toBe(true);
		expect(isGoogleAccessError(new Error(GOOGLE_UNAVAILABLE))).toBe(true);
		// A database outage is not Google's doing.
		expect(isGoogleAccessError(new Error("connect ECONNREFUSED 127.0.0.1:54329"))).toBe(false);
		expect(needsReauth(new Error(GOOGLE_UNAVAILABLE))).toBe(false);
	});

	it("says sign in again only when the connection has expired", () => {
		expect(googleErrorMessage(new Error(REAUTH_REQUIRED), "Google Calendar")).toMatch(/Sign in again/);
		expect(googleErrorMessage(new Error(GOOGLE_UNAVAILABLE), "Google Calendar")).toBe(
			"Google Calendar isn't answering right now. Try again in a moment.",
		);
	});
});
