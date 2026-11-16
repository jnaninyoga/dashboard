import { afterEach, describe, expect, it, vi } from "vitest";

import { requestSiteRebuild } from "./rebuild";

afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
});

describe("requestSiteRebuild", () => {
	it("asks Cloudflare to rebuild the site", async () => {
		vi.stubEnv("SITE_DEPLOY_HOOK_URL", "https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/abc");
		const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
		expect(await requestSiteRebuild("class times", fetchImpl as unknown as typeof fetch)).toBe("requested");
		expect(fetchImpl).toHaveBeenCalledWith(
			"https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/abc",
			expect.objectContaining({ method: "POST" }),
		);
	});

	it("does nothing without a hook", async () => {
		vi.stubEnv("SITE_DEPLOY_HOOK_URL", "");
		const fetchImpl = vi.fn();
		expect(await requestSiteRebuild("class times", fetchImpl as unknown as typeof fetch)).toBe("not_configured");
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it("says it failed when Cloudflare refuses or can't be reached, without throwing", async () => {
		vi.stubEnv("SITE_DEPLOY_HOOK_URL", "https://example.com/hook");
		vi.spyOn(console, "error").mockImplementation(() => {});
		const refused = vi.fn(async () => new Response("no", { status: 500 }));
		const down = vi.fn(async () => {
			throw new Error("down");
		});
		expect(await requestSiteRebuild("a card", refused as unknown as typeof fetch)).toBe("failed");
		expect(await requestSiteRebuild("a card", down as unknown as typeof fetch)).toBe("failed");
	});
});
