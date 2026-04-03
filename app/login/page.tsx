import Image from "next/image";

import { loginWithGoogle } from "@/actions/auth";
import { BloomingBlossoms } from "@/components/ui/blooming-blossoms";

import { Google } from "iconsax-reactjs";

export default function LoginPage() {
	return (
		<div className="bg-background relative flex min-h-dvh w-full items-center justify-center overflow-hidden px-5 py-10">
			{/* Blooming Blossoms Animation */}
			<BloomingBlossoms />

			{/* Ambient background blobs */}
			<div className="bg-primary/8 pointer-events-none absolute top-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full blur-3xl" />
			<div className="bg-secondary/15 pointer-events-none absolute bottom-[-15%] left-[-10%] h-[400px] w-[400px] rounded-full blur-3xl" />
			
			<div className="animate-slide-up relative z-10 flex w-full max-w-md flex-col items-center gap-10">
				{/* Logo & Brand */}
				<div className="flex flex-col items-center gap-4">
					<div className="zen-shadow-lg bg-card relative size-28 overflow-hidden rounded-full p-3">
						<Image
							src="/logo.png"
							alt="Jnanin Yoga Studio"
							fill
							className="object-contain p-2"
							priority
						/>
					</div>
					<div className="flex flex-col gap-1.5 text-center">
						<h1 className="font-heading text-foreground text-4xl font-bold tracking-tight uppercase">
							Jnanin Yoga
						</h1>
						<p className="text-muted-foreground text-base font-medium tracking-wide">
							Digital Command Center
						</p>
					</div>
				</div>

				{/* Main Card */}
				<div className="bg-card zen-shadow-lg flex w-full flex-col gap-6 rounded-3xl p-8">
					{/* MVP Notice
					<div className="rounded-2xl bg-secondary/30 p-5 flex gap-3.5">
						<div className="flex-shrink-0 mt-0.5">
							<div className="size-8 rounded-full bg-amber-100 flex items-center justify-center">
								<svg className="size-4 text-amber-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
								</svg>
							</div>
						</div>
						<div className="flex flex-col gap-1.5">
							<h3 className="text-sm font-bold text-foreground">Under Development</h3>
							<p className="text-sm text-muted-foreground leading-relaxed">
								This dashboard is actively being developed. Please <strong className="text-foreground font-semibold">do not use your main Google account</strong> to sign in. Use a dedicated test account.
							</p>
						</div>
					</div> */}

					{/* Sign In Button */}
					<form action={loginWithGoogle}>
						<button
							type="submit"
							className="group bg-primary text-primary-foreground zen-glow-teal relative flex min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl text-base font-semibold transition-all duration-200 ease-out hover:cursor-pointer hover:brightness-105 active:scale-[0.98]"
						>
							<Google size={22} variant="Bold" />
							Sign in with Google
						</button>
					</form>
				</div>

				{/* Footer */}
				<p className="text-muted-foreground/60 max-w-xs text-center text-xs">
					By signing in, you authorize access to Google Calendar and Contacts for studio management.
				</p>
			</div>
		</div>
	);
}
