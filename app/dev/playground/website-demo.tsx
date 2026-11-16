"use client";

import { ScheduleForm } from "@/components/schedule/settings/form";
import { ClassTimesForm } from "@/components/website/class-times-form";
import { DEFAULT_HOURS } from "@/lib/config/schedule";
import { DEFAULT_CLASS_TIMES } from "@/lib/domain/website/timetable";

// Monday and Thursday closing at 20:00, an hour before the website's last
// class: each side of the rule shows why it can't save.
const SHUT_AT_8PM = {
	...DEFAULT_HOURS,
	"1": { isOpen: true, start: "08:00", end: "20:00" },
	"4": { isOpen: true, start: "08:00", end: "20:00" },
};

export function WebsiteDemo() {
	return (
		<section className="grid min-w-0 gap-6 rounded-3xl border bg-card p-6" data-testid="website-demo">
			<h2 className="text-xl">Class times</h2>
			<ClassTimesForm initial={DEFAULT_CLASS_TIMES} hours={SHUT_AT_8PM} />
			<h2 className="text-xl">Studio hours</h2>
			<ScheduleForm initialData={SHUT_AT_8PM} classTimes={DEFAULT_CLASS_TIMES} />
		</section>
	);
}
