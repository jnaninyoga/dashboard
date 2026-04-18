import { getWorkingHours } from "@/actions/settings";
import { ScheduleForm } from "@/components/schedule/settings/form";

export default async function ScheduleSettingsPage() {
	const workingHours = await getWorkingHours();

	return (
		<>
			<header className="space-y-1">
				<h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">
					Studio Schedule
				</h1>
				<p className="text-md text-muted-foreground">
					Define your baseline working hours. Event bookings outside these times
					will be blocked.
				</p>
			</header>

			<ScheduleForm initialData={workingHours} />
		</>
	);
}
