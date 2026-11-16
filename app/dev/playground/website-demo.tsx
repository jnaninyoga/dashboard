"use client";

import { ScheduleForm } from "@/components/schedule/settings/form";
import { DEFAULT_HOURS } from "@/lib/config/schedule";

// Studio hours as the website had them (Monday and Thursday, six periods with
// their rests), plus a straight Saturday morning, so the page shows two groups.
const WEEK = { ...DEFAULT_HOURS, "6": { isOpen: true, periods: [{ start: "09:00", end: "13:00" }] } };

export function WebsiteDemo() {
	return (
		<section className="grid min-w-0 gap-6 rounded-3xl border bg-card p-6" data-testid="website-demo">
			<h2 className="text-xl">Studio hours</h2>
			<ScheduleForm initial={WEEK} />
		</section>
	);
}
