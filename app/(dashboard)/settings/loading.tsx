import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
			<div className="space-y-2">
				<Skeleton className="bg-muted-foreground/10 h-9 w-48" />
				<Skeleton className="bg-muted-foreground/10 h-4 w-64" />
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="border-border/50 space-y-4 rounded-2xl border p-6 shadow-sm">
						<div className="flex items-center gap-4">
							<Skeleton className="h-10 w-10 rounded-xl" />
							<div className="space-y-2">
								<Skeleton className="h-5 w-32" />
								<Skeleton className="h-4 w-24" />
							</div>
						</div>
						<Skeleton className="h-10 w-full rounded-xl" />
					</div>
				))}
			</div>
		</div>
	);
}
