import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
			{/* Back link skeleton */}
			<Skeleton className="bg-muted-foreground/10 h-4 w-28" />

			{/* Header Card Skeleton */}
			<div className="border-secondary/20 bg-card relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border p-8 shadow-sm md:flex-row">
				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-4">
						<Skeleton className="bg-muted-foreground/10 h-16 w-16 rounded-2xl" />
						<div className="space-y-2.5">
							<Skeleton className="bg-muted-foreground/10 h-9 w-52" />
							<div className="flex gap-2">
								<Skeleton className="bg-muted-foreground/10 h-6 w-24 rounded-full" />
								<Skeleton className="bg-muted-foreground/10 h-6 w-32 rounded-full" />
							</div>
						</div>
					</div>
					<Skeleton className="bg-muted-foreground/10 h-4 w-44" />
				</div>
				<div className="flex shrink-0 items-center">
					<div className="border-secondary/10 bg-background/80 flex items-center gap-8 rounded-2xl border px-6 py-4 shadow-xs">
						<div className="flex flex-col items-center gap-1.5">
							<Skeleton className="bg-muted-foreground/10 h-8 w-8" />
							<Skeleton className="bg-muted-foreground/10 h-3 w-14" />
						</div>
						<Skeleton className="bg-muted-foreground/10 h-8 w-px" />
						<div className="flex flex-col items-center gap-1.5">
							<Skeleton className="bg-muted-foreground/10 h-8 w-8" />
							<Skeleton className="bg-muted-foreground/10 h-3 w-10" />
						</div>
					</div>
				</div>
			</div>

			{/* Content Grid Skeleton */}
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
				{/* Contacts Column */}
				<div className="space-y-6 lg:col-span-1">
					<div className="flex items-center justify-between px-2">
						<Skeleton className="bg-muted-foreground/10 h-6 w-28" />
						<Skeleton className="bg-muted-foreground/10 h-9 w-20 rounded-full" />
					</div>
					<div className="flex flex-col gap-4">
						{Array.from({ length: 2 }).map((_, i) => (
							<div key={i} className="border-secondary/10 bg-card flex items-center justify-between rounded-2xl border p-4 shadow-xs">
								<div className="flex items-center gap-4">
									<Skeleton className="bg-muted-foreground/10 h-12 w-12 rounded-xl" />
									<div className="space-y-2">
										<Skeleton className="bg-muted-foreground/10 h-4 w-32" />
										<Skeleton className="bg-muted-foreground/10 h-3 w-20" />
									</div>
								</div>
								<div className="flex gap-1.5">
									<Skeleton className="bg-muted-foreground/10 h-9 w-9 rounded-xl" />
									<Skeleton className="bg-muted-foreground/10 h-9 w-9 rounded-xl" />
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Documents Column */}
				<div className="space-y-6 lg:col-span-2">
					<div className="flex items-center justify-between px-2">
						<Skeleton className="bg-muted-foreground/10 h-6 w-48" />
						<Skeleton className="bg-muted-foreground/10 h-9 w-36 rounded-full" />
					</div>
					<div className="border-secondary/10 overflow-hidden rounded-3xl border shadow-sm">
						{/* Table header */}
						<div className="border-secondary/10 bg-secondary/5 grid grid-cols-4 gap-4 border-b px-6 py-4">
							{["Document", "Type", "Status", "Amount"].map((h) => (
								<Skeleton key={h} className="bg-muted-foreground/10 h-3 w-16" />
							))}
						</div>
						{/* Table rows */}
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="border-secondary/10 grid grid-cols-4 items-center gap-4 border-b px-6 py-5 last:border-0">
								<div className="flex items-center gap-3">
									<Skeleton className="bg-muted-foreground/10 h-10 w-10 shrink-0 rounded-xl" />
									<div className="space-y-1.5">
										<Skeleton className="bg-muted-foreground/10 h-3.5 w-24" />
										<Skeleton className="bg-muted-foreground/10 h-3 w-16" />
									</div>
								</div>
								<Skeleton className="bg-muted-foreground/10 h-3.5 w-14" />
								<Skeleton className="bg-muted-foreground/10 h-6 w-20 rounded-full" />
								<Skeleton className="bg-muted-foreground/10 h-4 w-20" />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
