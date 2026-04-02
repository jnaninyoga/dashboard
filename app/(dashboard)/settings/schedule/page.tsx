import { getWorkingHours } from "@/actions/settings";
import { ScheduleForm } from "@/components/settings/schedule-form";

export default async function ScheduleSettingsPage() {
    const workingHours = await getWorkingHours();

	return (
		<>
			<header className="space-y-1">
				<h1 className="text-3xl md:text-4xl font-heading font-medium tracking-tight text-foreground">Studio Schedule</h1>
				<p className="text-md text-muted-foreground">
					Define your baseline working hours. Event bookings outside these times will be blocked.
				</p>
			</header>

            <ScheduleForm initialData={workingHours} />
		</>
	);
}
