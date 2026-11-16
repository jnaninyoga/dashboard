"use client";

import { ClassTimesForm } from "@/components/website/class-times-form";
import { DEFAULT_HOURS } from "@/lib/config/schedule";
import { DEFAULT_CLASS_TIMES } from "@/lib/domain/website/timetable";

// The class times as the website has them, with the default studio hours
// (open until 20:00), so the last class shows why it doesn't fit.
export function WebsiteDemo() {
	return (
		<section className="grid min-w-0 gap-6 rounded-3xl border bg-card p-6" data-testid="website-demo">
			<h2 className="text-xl">Class times</h2>
			<ClassTimesForm initial={DEFAULT_CLASS_TIMES} hours={DEFAULT_HOURS} />
		</section>
	);
}
