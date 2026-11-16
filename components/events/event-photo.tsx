"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { uploadOutdoorPhotoAction } from "@/lib/actions/outdoor";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { notifyWebsite } from "@/lib/feedback/website";
import { encodePhoto } from "@/lib/utils/photo";

import { Gallery, Refresh } from "iconsax-reactjs";

const LONG_SIDE = 1600;

/** The photo from her phone, made web-sized in the browser (longest side 1600px; WebP, or JPEG on an iPhone) before it's sent. */
async function resize(file: File) {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, LONG_SIDE / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.round(bitmap.width * scale);
	canvas.height = Math.round(bitmap.height * scale);
	canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();
	return encodePhoto((type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality)));
}

/** The session's photo: shown on its event page and its social card on the website. */
export function EventPhoto({ sessionId, src }: { sessionId: string; src: string | null }) {
	const input = useRef<HTMLInputElement>(null);
	const router = useRouter();
	const [pending, startTransition] = useTransition();

	const choose = (file: File | undefined) => {
		if (!file) return;
		startTransition(async () => {
			let photo: Awaited<ReturnType<typeof resize>>;
			try {
				photo = await resize(file);
			} catch {
				return void notify.error("This photo can't be read", { description: "Try a JPEG or PNG." });
			}
			const form = new FormData();
			form.append("photo", new File([photo.blob], photo.type === "image/webp" ? "photo.webp" : "photo.jpg", { type: photo.type }));
			const result = await uploadOutdoorPhotoAction(sessionId, form);
			if (result.error) return void notifyActionError(result, "Couldn't save the photo");
			notify.success("Photo saved");
			notifyWebsite(result.website);
			router.refresh();
		});
	};

	return (
		<div className="grid gap-3">
			<div className="relative aspect-4/3 overflow-hidden rounded-3xl border border-secondary/20 bg-muted">
				{src ? (
					// eslint-disable-next-line @next/next/no-img-element -- her own photo, served by the dashboard
					<img src={src} alt="The event's photo" className="size-full object-cover" />
				) : (
					<div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
						<Gallery size={40} variant="Bulk" />
						<span className="text-sm">No photo yet</span>
					</div>
				)}
			</div>
			<input ref={input} type="file" accept="image/*" className="sr-only" onChange={(e) => choose(e.target.files?.[0])} />
			<Button type="button" variant="outline" disabled={pending} onClick={() => input.current?.click()} className="h-11 rounded-2xl">
				{pending ? <Refresh className="mr-2 size-4 animate-spin" /> : <Gallery size={18} className="mr-2" />}
				{src ? "Change the photo" : "Add a photo"}
			</Button>
		</div>
	);
}
