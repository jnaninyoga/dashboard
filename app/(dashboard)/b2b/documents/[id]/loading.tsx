import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
			{/* Breadcrumb Skeleton */}
			<Skeleton className="bg-muted-foreground/10 h-4 w-32" />

			{/* Header Zen Card Skeleton */}
			<div className="border-secondary/20 bg-card relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border p-8 shadow-sm md:flex-row">
				<div className="relative z-10 flex w-full flex-col gap-6">
					<div className="flex items-center gap-4">
						<Skeleton className="bg-muted-foreground/10 size-14 rounded-2xl" />
						<div className="space-y-2">
							<Skeleton className="bg-muted-foreground/10 h-8 w-48" />
							<Skeleton className="bg-muted-foreground/10 h-3 w-24" />
						</div>
					</div>

					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						<div className="flex items-center gap-3">
							<Skeleton className="bg-muted-foreground/10 size-10 rounded-xl" />
							<div className="space-y-1">
								<Skeleton className="bg-muted-foreground/10 h-2 w-12" />
								<Skeleton className="bg-muted-foreground/10 h-4 w-32" />
							</div>
						</div>
						<div className="flex items-center gap-3">
							<Skeleton className="bg-muted-foreground/10 size-10 rounded-xl" />
							<div className="space-y-1">
								<Skeleton className="bg-muted-foreground/10 h-2 w-16" />
								<Skeleton className="bg-muted-foreground/10 h-4 w-32" />
							</div>
						</div>
						<div className="flex items-center gap-3">
							<Skeleton className="bg-muted-foreground/10 size-10 rounded-xl" />
							<div className="space-y-1">
								<Skeleton className="bg-muted-foreground/10 h-2 w-16" />
								<Skeleton className="bg-muted-foreground/10 h-4 w-32" />
							</div>
						</div>
					</div>
				</div>

				<div className="relative z-10 mt-8 flex shrink-0 flex-col justify-end text-right md:mt-0">
					<Skeleton className="bg-muted-foreground/10 mb-2 ml-auto h-3 w-24" />
					<Skeleton className="bg-muted-foreground/10 ml-auto h-10 w-48" />
				</div>
			</div>

			{/* Actions Ribbon Mimic */}
			<div className="flex justify-end gap-2">
			    <Skeleton className="bg-muted-foreground/10 h-9 w-24 rounded-lg" />
			    <Skeleton className="bg-muted-foreground/10 h-9 w-24 rounded-lg" />
			    <Skeleton className="bg-muted-foreground/10 h-9 w-8 rounded-lg" />
			</div>

			{/* Line Items Section Mimic */}
			<div className="border bg-card overflow-hidden rounded-2xl border shadow-sm">
				<div className="bg-muted-foreground/5 h-10 w-full border-b" />
				<div className="divide-secondary/15 space-y-0 divide-y">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="flex items-center justify-between p-4">
							<Skeleton className="bg-muted-foreground/10 h-4 w-64" />
							<Skeleton className="bg-muted-foreground/10 h-4 w-8" />
							<Skeleton className="bg-muted-foreground/10 h-4 w-16" />
							<Skeleton className="bg-muted-foreground/10 h-4 w-20" />
						</div>
					))}
				</div>
			</div>
			
			<div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
				<div className="border bg-card flex w-full flex-col items-end gap-2.5 rounded-2xl border p-4 shadow-sm sm:max-w-xs">
				    <Skeleton className="bg-muted-foreground/10 h-5 w-48" />
				    <Skeleton className="bg-muted-foreground/10 h-5 w-48" />
				    <Skeleton className="bg-muted-foreground/10 mt-2 h-8 w-64" />
				</div>
			</div>

			{/* Notes Mimic */}
			<Skeleton className="bg-muted-foreground/10 mt-4 h-32 w-full rounded-2xl" />
		</div>
	);
}
