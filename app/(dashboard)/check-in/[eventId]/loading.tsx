import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="bg-background flex min-h-screen flex-col pb-24 font-sans">
			{/* Header Skeleton Mimic */}
			<header className="bg-muted-foreground/10 px-6 py-8 md:py-10">
				<div className="mx-auto flex max-w-4xl flex-col gap-4">
					<div className="mb-1 flex items-center justify-between">
						<Skeleton className="bg-muted-foreground/10 h-5 w-32" />
						<Skeleton className="bg-muted-foreground/10 h-6 w-24 rounded-full" />
					</div>
					
					<Skeleton className="bg-muted-foreground/10 h-16 w-3/4 md:h-20" />
					
					<div className="mt-1 flex items-center gap-2">
						<Skeleton className="bg-muted-foreground/10 h-5 w-5 rounded-full" />
						<Skeleton className="bg-muted-foreground/10 h-5 w-64" />
					</div>
				</div>
			</header>

			{/* Main Content Area Skeleton */}
			<main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-5 py-6 md:px-6">
                {/* Search Bar Skeleton */}
                <div className="flex flex-col gap-2">
                    <Skeleton className="bg-muted-foreground/10 h-12 w-full rounded-2xl" />
                </div>

                {/* List Skeleton */}
				<div className="border-border/50 space-y-4 rounded-2xl border p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <Skeleton className="bg-muted-foreground/10 h-6 w-32" />
                        <Skeleton className="bg-muted-foreground/10 h-6 w-20" />
                    </div>
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className="border-border/10 flex items-center justify-between rounded-xl border-b pb-4 last:border-0 last:pb-0"
						>
							<div className="flex items-center gap-4">
                                <Skeleton className="bg-muted-foreground/10 h-10 w-10 rounded-full" />
								<div className="space-y-2">
									<Skeleton className="bg-muted-foreground/10 h-4 w-32" />
									<Skeleton className="bg-muted-foreground/10 h-3 w-48" />
								</div>
							</div>
							<Skeleton className="bg-muted-foreground/10 h-8 w-8 rounded-lg" />
						</div>
					))}
				</div>
			</main>
		</div>
	);
}
