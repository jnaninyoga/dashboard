import { ClassTimesForm } from "@/components/website/class-times-form";
import { getWorkingHours } from "@/lib/actions/settings";
import { getClassTimes } from "@/lib/actions/website";
import { DEFAULT_HOURS } from "@/lib/config/schedule";

export default async function ClassTimesPage() {
	const [classTimes, hours] = await Promise.all([getClassTimes(), getWorkingHours()]);

	return (
		<>
			<header className="space-y-1">
				<h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">Class times</h1>
				<p className="text-md text-muted-foreground">
					The weekly classes on jnaninyoga.com. They have to fit your Studio hours; other days stay by appointment.
				</p>
			</header>

			<ClassTimesForm initial={classTimes} hours={hours ?? DEFAULT_HOURS} />
		</>
	);
}
