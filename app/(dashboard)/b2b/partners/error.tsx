"use client";

import { useEffect } from "react";

import { BloomingBlossoms } from "@/components/ui/blooming-blossoms";

import { Refresh2 } from "iconsax-reactjs";

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("B2B Partners Error:", error);
	}, [error]);

	return (
		<div className="bg-background fixed inset-0 z-100 flex min-h-dvh w-full items-center justify-center overflow-hidden px-5 py-10">
			<BloomingBlossoms />

			{/* Ambient background blobs */}
			<div className="bg-destructive/10 pointer-events-none absolute top-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full opacity-60 blur-3xl" />
			<div className="bg-secondary/15 pointer-events-none absolute bottom-[-15%] left-[-10%] h-[400px] w-[400px] rounded-full blur-3xl" />

			<div className="animate-slide-up relative z-10 flex w-full max-w-md flex-col items-center gap-8 text-center">
				<div className="flex flex-col items-center">
					<div className="font-heading text-destructive/60 text-9xl font-black tracking-tighter select-none">
						ERROR
					</div>
					<div className="font-heading text-foreground -mt-4 text-5xl font-bold">
						B2B connection lost
					</div>
				</div>

				<div className="flex max-w-sm flex-col gap-3">
					<h2 className="text-muted-foreground text-lg leading-relaxed font-medium">
						{error.message || "An unexpected error occurred while loading partners."}
						{error.digest ? (
							<div className="mt-2 font-mono text-xs opacity-50">
								Digest: {error.digest}
							</div>
						) : null}
					</h2>
				</div>

				<button
					onClick={() => reset()}
					className="group bg-primary text-primary-foreground zen-glow-teal relative flex min-h-[56px] w-full max-w-xs items-center justify-center gap-3 rounded-2xl text-base font-semibold transition-all duration-200 ease-out hover:cursor-pointer hover:brightness-105 active:scale-[0.98]"
				>
					<Refresh2 size={24} variant="Bold" />
					Reconnect Partner
				</button>

				<p className="font-vibes text-muted-foreground/60 mt-4 max-w-sm text-center text-xl">
					Even in business, let your breath be your guide.
				</p>
			</div>
		</div>
	);
}
