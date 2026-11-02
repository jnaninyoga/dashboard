import { ScheduleForm } from "@/components/schedule/settings/form";
import { getWorkingHours } from "@/lib/actions/settings";

export default async function StudioHoursPage() {
	const workingHours = await getWorkingHours();

	return (
		<>
			<header className="space-y-1">
				<h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">Studio hours</h1>
				<p className="text-md text-muted-foreground">
					When the studio is open. A class or private session outside these hours can&apos;t be scheduled (partner and outdoor sessions can).
				</p>
			</header>

			<ScheduleForm initialData={workingHours} />
		</>
	);
}
