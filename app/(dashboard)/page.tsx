export default function Home() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<h1 className="text-2xl font-bold">Today's Schedule</h1>
			<div className="grid auto-rows-min gap-4 md:grid-cols-3">
				<div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
					<span className="text-muted-foreground">Class 1</span>
				</div>
				<div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
					<span className="text-muted-foreground">Class 2</span>
				</div>
				<div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
					<span className="text-muted-foreground">Private Session</span>
				</div>
			</div>
			<div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-10 flex items-center justify-center">
				<span className="text-muted-foreground">Calendar Sync View (Todo)</span>
			</div>
		</div>
	);
}
