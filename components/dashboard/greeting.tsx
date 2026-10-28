"use client";

import { useEffect, useState } from "react";

import { DayPeriodIcon } from "@/components/dashboard/day-period-icon";
import { type DayPeriod, getDayPeriod, toStudioTime } from "@/lib/utils/time";

import { format } from "date-fns";

const GREETINGS: Record<DayPeriod, string> = {
	morning: "Bonjour",
	afternoon: "Bon après-midi",
	evening: "Bonsoir",
	night: "Bonsoir",
};

export function Greeting({ firstName, now }: { firstName: string; now: string }) {
	// Starts from the server's instant so the first render matches the HTML,
	// then follows the clock so a page left open rolls over to the next part
	// of the day on its own.
	const [instant, setInstant] = useState(() => new Date(now));
	useEffect(() => {
		const id = setInterval(() => setInstant(new Date()), 60_000);
		return () => clearInterval(id);
	}, []);

	const studioTime = toStudioTime(instant);
	const period = getDayPeriod(studioTime);
	const greeting = firstName
		? `${GREETINGS[period]}, ${firstName}`
		: GREETINGS[period];

	return (
		<div className="flex items-center gap-4">
			<DayPeriodIcon period={period} />
			<div className="space-y-1">
				<h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">
					{greeting}
				</h1>
				<p className="text-md text-muted-foreground">
					{format(studioTime, "EEEE, MMMM do, yyyy")}
				</p>
			</div>
		</div>
	);
}
