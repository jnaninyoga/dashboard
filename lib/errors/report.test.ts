import { afterEach, describe, expect, it, vi } from "vitest";

import { buildErrorReport, errorReportMailto, formatErrorReport, newErrorCode } from "./report";

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("newErrorCode", () => {
	it("is short and has no characters that are confusing to read aloud", () => {
		for (let i = 0; i < 200; i++) {
			expect(newErrorCode()).toMatch(/^JY-[2-9A-HJ-KM-NP-Z]{6}$/);
		}
	});
});

describe("buildErrorReport", () => {
	it("uses the server's code when there is one, else Next's digest, else a new code", () => {
		const withDigest = Object.assign(new Error("boom"), { digest: "123456" });
		expect(buildErrorReport({ error: withDigest, code: "JY-AAAAAA" }).code).toBe("JY-AAAAAA");
		expect(buildErrorReport({ error: withDigest }).code).toBe("123456");
		expect(buildErrorReport({ error: new Error("boom") }).code).toMatch(/^JY-/);
	});

	it("turns anything thrown into a readable message", () => {
		expect(buildErrorReport({ error: "plain string" }).message).toBe("plain string");
	});
});

describe("report text and email", () => {
	const report = buildErrorReport({ error: new Error("Failed to record payment"), code: "JY-7K2Q9M" });

	it("contains the code and what happened", () => {
		const text = formatErrorReport(report);
		expect(text).toContain("Error code: JY-7K2Q9M");
		expect(text).toContain("What happened: Failed to record payment");
	});

	it("offers no email link when no developer address is configured", () => {
		vi.stubEnv("NEXT_PUBLIC_SUPPORT_EMAIL", "");
		expect(errorReportMailto(report)).toBeNull();
	});

	it("prefills a short enough email when an address is set", () => {
		vi.stubEnv("NEXT_PUBLIC_SUPPORT_EMAIL", "dev@example.com");
		const long = buildErrorReport({ error: Object.assign(new Error("x"), { stack: "at x\n".repeat(2000) }) });
		const href = errorReportMailto(long);
		expect(href).toMatch(/^mailto:dev@example\.com\?subject=/);
		expect(decodeURIComponent(href!.split("&body=")[1]).length).toBeLessThanOrEqual(1800);
	});
});
