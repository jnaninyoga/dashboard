import { loginWithGoogle } from "@/actions/auth";
import { Google } from "iconsax-reactjs";
import Image from "next/image";
import { BloomingBlossoms } from "@/components/ui/blooming-blossoms";

export default function LoginPage() {
	return (
		<div className="flex min-h-dvh w-full items-center justify-center bg-background px-5 py-10 relative overflow-hidden">
			{/* Blooming Blossoms Animation */}
			<BloomingBlossoms />

			{/* Ambient background blobs */}
			<div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl pointer-events-none" />
			<div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
			
			<div className="w-full max-w-md flex flex-col items-center gap-10 animate-slide-up relative z-10">
				{/* Logo & Brand */}
				<div className="flex flex-col items-center gap-4">
					<div className="relative size-28 zen-shadow-lg rounded-full overflow-hidden bg-card p-3">
						<Image
							src="/logo.png"
							alt="Jnanin Yoga Studio"
							fill
							className="object-contain p-2"
							priority
						/>
					</div>
					<div className="text-center flex flex-col gap-1.5">
						<h1 className="text-4xl font-heading font-bold uppercase tracking-tight text-foreground">
							Jnanin Yoga
						</h1>
						<p className="text-muted-foreground text-base font-medium tracking-wide">
							Digital Command Center
						</p>
					</div>
				</div>

				{/* Main Card */}
				<div className="w-full bg-card zen-shadow-lg rounded-3xl p-8 flex flex-col gap-6">
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
							className="hover:cursor-pointer group relative flex w-full items-center justify-center min-h-[56px] rounded-2xl bg-primary text-primary-foreground font-semibold text-base zen-glow-teal hover:brightness-105 active:scale-[0.98] transition-all duration-200 ease-out gap-3"
						>
							<Google size={22} variant="Bold" />
							Sign in with Google
						</button>
					</form>
				</div>

				{/* Footer */}
				<p className="text-xs text-muted-foreground/60 text-center max-w-xs">
					By signing in, you authorize access to Google Calendar and Contacts for studio management.
				</p>
			</div>
		</div>
	);
}
