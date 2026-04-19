import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="flex flex-col gap-8">
			{/* Header Skeleton */}
			<div className="animate-slide-up flex flex-col justify-between gap-4 pb-8 md:flex-row md:items-center">
				<div className="space-y-1.5">
					<Skeleton className="bg-muted-foreground/10 h-10 w-64 rounded-lg" />
					<Skeleton className="bg-muted-foreground/10 h-4 w-96 rounded-md" />
				</div>
				<Skeleton className="bg-muted-foreground/10 h-11 w-48 rounded-2xl" />
			</div>

			{/* Main Grid Skeleton */}
			<div className="grid gap-8 lg:grid-cols-3">
				<div className="animate-slide-up space-y-8 lg:col-span-2">
					{/* Studio Identity Card Skeleton */}
					<div className="border-secondary/20 bg-card overflow-hidden rounded-3xl border shadow-sm">
						<div className="border-b border-secondary/10 p-6">
							<div className="flex items-center gap-4">
								<Skeleton className="bg-muted-foreground/10 h-12 w-12 rounded-2xl" />
								<div className="space-y-2">
									<Skeleton className="bg-muted-foreground/10 h-6 w-32 rounded-md" />
									<Skeleton className="bg-muted-foreground/10 h-4 w-48 rounded-md" />
								</div>
							</div>
						</div>
						<div className="grid gap-8 p-6 md:grid-cols-2">
							{Array.from({ length: 4 }).map((_, i) => (
								<div key={i} className="space-y-2.5">
									<Skeleton className="bg-muted-foreground/10 h-3 w-24 rounded-full" />
									<Skeleton className="bg-muted-foreground/10 h-14 w-full rounded-xl" />
								</div>
							))}
						</div>
					</div>

					{/* Legal Identifiers Card Skeleton */}
					<div className="border-secondary/20 bg-card overflow-hidden rounded-3xl border shadow-sm">
						<div className="border-b border-secondary/10 p-6">
							<div className="flex items-center gap-4">
								<Skeleton className="bg-muted-foreground/10 h-12 w-12 rounded-2xl" />
								<div className="space-y-2">
									<Skeleton className="bg-muted-foreground/10 h-6 w-36 rounded-md" />
									<Skeleton className="bg-muted-foreground/10 h-4 w-56 rounded-md" />
								</div>
							</div>
						</div>
						<div className="space-y-6 p-6">
							<div className="space-y-4">
								{Array.from({ length: 2 }).map((_, i) => (
									<div key={i} className="flex items-center gap-4">
										<Skeleton className="bg-muted-foreground/10 h-14 flex-1 rounded-xl" />
										<Skeleton className="bg-muted-foreground/10 h-14 flex-1 rounded-xl" />
										<Skeleton className="bg-muted-foreground/10 h-10 w-10 rounded-xl" />
									</div>
								))}
							</div>
							<Skeleton className="bg-muted-foreground/10 h-12 w-full rounded-2xl border-dashed" />
						</div>
					</div>
				</div>

				{/* Sidebar: Assets Skeleton */}
				<div className="animate-slide-left space-y-6">
					<div className="border-secondary/20 bg-card overflow-hidden rounded-3xl border shadow-sm">
						<div className="flex flex-row items-center justify-between p-6">
							<div className="space-y-2">
								<Skeleton className="bg-muted-foreground/10 h-6 w-32 rounded-md" />
								<Skeleton className="bg-muted-foreground/10 h-4 w-44 rounded-md" />
							</div>
							<Skeleton className="bg-muted-foreground/10 h-6 w-6 rounded-full" />
						</div>
						<div className="space-y-7 p-6 pt-0">
							<div className="space-y-3">
								<Skeleton className="bg-muted-foreground/10 h-3 w-24 rounded-full" />
								<Skeleton className="bg-muted-foreground/10 aspect-square w-full rounded-3xl" />
							</div>
							<div className="space-y-3">
								<Skeleton className="bg-muted-foreground/10 h-3 w-36 rounded-full" />
								<Skeleton className="bg-muted-foreground/10 aspect-video w-full rounded-3xl" />
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Document Configuration Skeleton */}
			<section className="animate-slide-up">
				<div className="border-secondary/20 bg-card overflow-hidden rounded-3xl border shadow-sm">
					<div className="border-b border-secondary/10 p-6">
						<div className="flex items-center gap-4">
							<Skeleton className="bg-muted-foreground/10 h-12 w-12 rounded-2xl" />
							<div className="space-y-2">
								<Skeleton className="bg-muted-foreground/10 h-6 w-56 rounded-md" />
								<Skeleton className="bg-muted-foreground/10 h-4 w-64 rounded-md" />
							</div>
						</div>
					</div>
					<div className="space-y-6 p-6">
						<div className="flex flex-col justify-between gap-4 border-b border-secondary/10 pb-6 md:flex-row md:items-center">
							<div className="space-y-1">
								<Skeleton className="bg-muted-foreground/10 h-4 w-44 rounded-md" />
								<Skeleton className="bg-muted-foreground/10 h-3 w-64 rounded-md" />
							</div>
							<Skeleton className="bg-muted-foreground/10 h-10 w-32 rounded-2xl" />
						</div>
						<Skeleton className="bg-muted-foreground/10 h-48 w-full rounded-3xl" />
					</div>
				</div>
			</section>
		</div>
	);
}
