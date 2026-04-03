import { BloomingBlossoms } from "@/components/ui/blooming-blossoms";
import { Home2 } from "iconsax-reactjs";
import Link from "next/link";

export default function NotFound() {
	return (
		<div className="flex min-h-dvh w-full items-center justify-center bg-background px-5 py-10 relative overflow-hidden">
			{/* Blooming Blossoms Animation */}
			<BloomingBlossoms />

			{/* Ambient background blobs (same as login/page.tsx) */}
			<div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl pointer-events-none" />
			<div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
			
			<div className="w-full max-w-md flex flex-col items-center gap-8 animate-slide-up relative z-10 text-center">
				{/* 404 visual */}
				<div className="flex flex-col items-center">
					<div className="text-9xl font-heading font-black tracking-tighter text-primary/60 select-none">
						404
					</div>
					<div className="text-5xl font-heading font-bold text-foreground -mt-4">
						Find Your Center
					</div>
				</div>

				<div className="flex flex-col gap-3 max-w-sm">
					<h2 className="text-lg font-medium text-muted-foreground leading-relaxed">
						Take a deep breath. 
						<br />
						This path seems to have drifted away. Let&apos;s guide you back to your practice.
					</h2>
				</div>

				{/* Back to Home Button */}
				<Link 
					href="/"
					className="hover:cursor-pointer group relative flex w-full max-w-xs items-center justify-center min-h-[56px] rounded-2xl bg-primary text-primary-foreground font-semibold text-base zen-glow-teal hover:brightness-105 active:scale-[0.98] transition-all duration-200 ease-out gap-3"
				>
					<Home2 size={24} variant="Bold" />
					Back to Dashboard
				</Link>

				<p className="text-xl font-vibes text-muted-foreground/60 max-w-sm mt-4">
					In the midst of movement and chaos, keep stillness inside of you.
				</p>
			</div>
		</div>
	);
}
