import { ScheduleForm } from "@/components/schedule/settings/form";
import { getWorkingHours } from "@/lib/actions/settings";
import { getClassTimes } from "@/lib/actions/website";

export default async function StudioHoursPage() {
	const [workingHours, classTimes] = await Promise.all([getWorkingHours(), getClassTimes()]);

	return (
		<>
			<header className="space-y-1">
				<h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">Studio hours</h1>
				<p className="text-md text-muted-foreground">
					When the studio is open. A class or private session outside these hours can&apos;t be scheduled (partner and outdoor sessions can).
				</p>
			</header>

			<ScheduleForm initialData={workingHours} classTimes={classTimes} />
		</>
	);
}
