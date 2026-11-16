import { type BookingRequest } from "@/services/database/schema";

import { describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({ sendRequestEmail: vi.fn() }));
vi.mock("./push", () => ({ sendRequestPush: vi.fn() }));

const { notifyNewRequest } = await import("./index");

const request = { id: "abc" } as BookingRequest;

describe("notifyNewRequest", () => {
	it("never throws when a channel fails", async () => {
		const failing = async () => {
			throw new Error("SMTP not configured");
		};
		const log = vi.spyOn(console, "error").mockImplementation(() => {});
		await expect(notifyNewRequest(request, { email: failing, push: failing })).resolves.toBeUndefined();
		expect(log).toHaveBeenCalledTimes(2);
		log.mockRestore();
	});

	it("sends on both channels", async () => {
		const email = vi.fn(async () => {});
		const push = vi.fn(async () => {});
		await notifyNewRequest(request, { email, push });
		expect(email).toHaveBeenCalledOnce();
		expect(push).toHaveBeenCalledOnce();
	});

	it("still sends the email when the phone fails", async () => {
		const email = vi.fn(async () => {});
		const push = vi.fn(async () => {
			throw new Error("Push not configured");
		});
		const log = vi.spyOn(console, "error").mockImplementation(() => {});
		await notifyNewRequest(request, { email, push });
		expect(email).toHaveBeenCalledOnce();
		log.mockRestore();
	});
});
