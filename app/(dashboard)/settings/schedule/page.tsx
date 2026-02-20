import { getWorkingHours } from "@/actions/settings";
import { ScheduleForm } from "@/components/settings/schedule-form";

export default async function ScheduleSettingsPage() {
    const workingHours = await getWorkingHours();

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Studio Schedule</h1>
				<p className="text-muted-foreground">
					Define your baseline working hours. Event bookings outside these times will be blocked.
				</p>
			</div>

            <ScheduleForm initialData={workingHours} />
		</div>
	);
}
