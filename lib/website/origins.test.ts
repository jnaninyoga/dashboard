import { describe, expect, it } from "vitest";

import { clientIp } from "./ip";
import { corsHeaders, websiteOrigins } from "./origins";

describe("websiteOrigins", () => {
	it("lists the origins", () => {
		expect(
			websiteOrigins({ WEBSITE_ORIGINS: " https://jnaninyoga.com, https://jnaninyoga.pages.dev ,," } as unknown as NodeJS.ProcessEnv),
		).toEqual(["https://jnaninyoga.com", "https://jnaninyoga.pages.dev"]);
	});

	it("lists none when unset", () => {
		expect(websiteOrigins({} as unknown as NodeJS.ProcessEnv)).toEqual([]);
	});
});

describe("corsHeaders", () => {
	it("answers CORS only for the site", () => {
		expect(corsHeaders("https://jnaninyoga.com", ["https://jnaninyoga.com"])?.["Access-Control-Allow-Origin"]).toBe(
			"https://jnaninyoga.com",
		);
		expect(corsHeaders("https://evil.example", ["https://jnaninyoga.com"])).toBeNull();
		expect(corsHeaders(null, ["https://jnaninyoga.com"])).toBeNull();
	});

	it("allows the form's POST and its JSON header", () => {
		expect(corsHeaders("https://jnaninyoga.com", ["https://jnaninyoga.com"])).toMatchObject({
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "content-type",
			Vary: "Origin",
		});
	});
});

describe("clientIp", () => {
	it("takes the first forwarded address", () => {
		expect(clientIp(new Headers({ "x-forwarded-for": "41.1.2.3, 10.0.0.1" }))).toBe("41.1.2.3");
	});

	it("falls back to the real IP header, then nothing", () => {
		expect(clientIp(new Headers({ "x-real-ip": "41.1.2.3" }))).toBe("41.1.2.3");
		expect(clientIp(new Headers())).toBeNull();
	});
});
