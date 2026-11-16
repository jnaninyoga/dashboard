/** Asks the canvas for an image of a type, at a quality (canvas.toBlob, as a promise). */
export type Encoder = (type: string, quality: number) => Promise<Blob | null>;

const QUALITY = 0.82;

/**
 * Encodes a photo as WebP, or as JPEG where the browser can't make WebP: an
 * iPhone's canvas quietly returns a PNG instead (too big, and wrongly named
 * if sent as WebP). The type returned is what the bytes really are.
 */
export async function encodePhoto(encode: Encoder): Promise<{ blob: Blob; type: "image/webp" | "image/jpeg" }> {
	const webp = await encode("image/webp", QUALITY);
	if (webp?.type === "image/webp") return { blob: webp, type: "image/webp" };
	const jpeg = await encode("image/jpeg", QUALITY);
	if (jpeg?.type === "image/jpeg") return { blob: jpeg, type: "image/jpeg" };
	throw new Error("This browser can't encode the photo");
}
