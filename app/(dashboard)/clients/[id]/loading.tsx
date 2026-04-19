import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
			{/* Header Skeleton */}
			<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
				<div className="flex items-center gap-4">
					<Skeleton className="bg-muted-foreground/10 h-20 w-20 rounded-full" />
					<div className="space-y-3">
						<Skeleton className="bg-muted-foreground/10 h-9 w-64" />
						<div className="flex gap-2">
							<Skeleton className="bg-muted-foreground/10 h-6 w-24 rounded-full" />
							<Skeleton className="bg-muted-foreground/10 h-6 w-20 rounded-full" />
						</div>
					</div>
				</div>
				<div className="flex gap-2">
					<Skeleton className="bg-muted-foreground/10 h-10 w-32 rounded-xl" />
					<Skeleton className="bg-muted-foreground/10 h-10 w-10 rounded-xl" />
				</div>
			</div>

			<Separator className="bg-foreground/5" />

			{/* Tabs Layout Skeleton */}
			<div className="space-y-6">
				<div className="flex items-center gap-2 overflow-x-auto pb-2">
					<Skeleton className="bg-muted-foreground/10 h-10 w-24 shrink-0 rounded-lg" />
					<Skeleton className="bg-muted-foreground/10 h-10 w-24 shrink-0 rounded-lg" />
					<Skeleton className="bg-muted-foreground/10 h-10 w-24 shrink-0 rounded-lg" />
					<Skeleton className="bg-muted-foreground/10 h-10 w-24 shrink-0 rounded-lg" />
				</div>

				<div className="grid gap-6 md:grid-cols-2">
					{/* Mock Field Bubbles */}
					<div className="border-border/10 space-y-6 rounded-3xl border bg-card/50 p-6 shadow-sm">
						<Skeleton className="bg-muted-foreground/10 h-6 w-40" />
						<div className="space-y-4">
							<div className="bg-muted/30 flex items-center gap-4 rounded-2xl p-3">
								<Skeleton className="bg-muted-foreground/10 h-10 w-10 rounded-xl" />
								<div className="flex-1 space-y-2">
									<Skeleton className="bg-muted-foreground/10 h-3 w-20" />
									<Skeleton className="bg-muted-foreground/10 h-4 w-full" />
								</div>
							</div>
							<div className="bg-muted/30 flex items-center gap-4 rounded-2xl p-3">
								<Skeleton className="bg-muted-foreground/10 h-10 w-10 rounded-xl" />
								<div className="flex-1 space-y-2">
									<Skeleton className="bg-muted-foreground/10 h-3 w-20" />
									<Skeleton className="bg-muted-foreground/10 h-4 w-3/4" />
								</div>
							</div>
						</div>
					</div>

					<div className="border-border/10 space-y-6 rounded-3xl border bg-card/50 p-6 shadow-sm">
						<Skeleton className="bg-muted-foreground/10 h-6 w-32" />
						<div className="space-y-4">
							<div className="bg-muted/30 flex items-center gap-4 rounded-2xl p-3">
								<Skeleton className="bg-muted-foreground/10 h-10 w-10 rounded-xl" />
								<div className="flex-1 space-y-2">
									<Skeleton className="bg-muted-foreground/10 h-3 w-16" />
									<Skeleton className="bg-muted-foreground/10 h-4 w-full" />
								</div>
							</div>
							<div className="bg-muted/30 flex items-center gap-4 rounded-2xl p-3">
								<Skeleton className="bg-muted-foreground/10 h-10 w-10 rounded-xl" />
								<div className="flex-1 space-y-2">
									<Skeleton className="bg-muted-foreground/10 h-3 w-16" />
									<Skeleton className="bg-muted-foreground/10 h-4 w-1/2" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
