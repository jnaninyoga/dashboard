import { describe, expect, it, vi } from "vitest";

import { encodePhoto } from "./photo";

const blob = (type: string) => new Blob(["x"], { type });

describe("encodePhoto", () => {
	it("keeps WebP where the browser makes it", async () => {
		const encode = vi.fn(async (type: string) => blob(type));
		expect((await encodePhoto(encode)).type).toBe("image/webp");
		expect(encode).toHaveBeenCalledTimes(1);
	});

	it("falls back to JPEG on an iPhone, whose canvas returns PNG when asked for WebP", async () => {
		const encode = vi.fn(async (type: string) => blob(type === "image/webp" ? "image/png" : type));
		const photo = await encodePhoto(encode);
		expect(photo.type).toBe("image/jpeg");
		expect(photo.blob.type).toBe("image/jpeg");
		expect(encode).toHaveBeenLastCalledWith("image/jpeg", 0.82);
	});

	it("fails clearly when the browser can encode neither", async () => {
		await expect(encodePhoto(async () => null)).rejects.toThrow("can't encode");
	});
});
