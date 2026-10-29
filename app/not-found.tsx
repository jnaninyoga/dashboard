import Link from "next/link";

import { LotusPond } from "@/components/ui/lotus-pond";

import { Home2 } from "iconsax-reactjs";

export default function NotFound() {
	return (
		<div className="bg-background fixed inset-0 z-100 flex min-h-dvh w-full items-center justify-center overflow-hidden px-5 py-10">
			<LotusPond />

			<div className="animate-slide-up relative z-10 flex w-full max-w-md flex-col items-center gap-8 text-center">
				{/* 404 visual */}
				<div className="flex flex-col items-center">
					<div className="font-heading text-primary/60 text-9xl font-black tracking-tighter select-none">
						404
					</div>
					<div className="font-heading text-foreground -mt-4 text-5xl font-bold">
						Find Your Center
					</div>
				</div>

				<div className="flex max-w-sm flex-col gap-3">
					<h2 className="text-muted-foreground text-lg leading-relaxed font-medium">
						Take a deep breath. 
						<br />
						This path seems to have drifted away. Let&apos;s guide you back to your practice.
					</h2>
				</div>

				{/* Back to Home Button */}
				<Link 
					href="/"
					className="group bg-primary text-primary-foreground zen-glow-teal relative flex min-h-[56px] w-full max-w-xs items-center justify-center gap-3 rounded-2xl text-base font-semibold transition-all duration-200 ease-out hover:cursor-pointer hover:brightness-105 active:scale-[0.98]"
				>
					<Home2 size={24} variant="Bold" />
					Back to Dashboard
				</Link>

				<p className="font-vibes text-muted-foreground/60 mt-4 max-w-sm text-xl">
					In the midst of movement and chaos, keep stillness inside of you.
				</p>
			</div>
		</div>
	);
}
