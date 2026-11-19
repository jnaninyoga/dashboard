import { RestoreToCalendar } from "@/components/events/event-actions";
import { type EventPhase } from "@/lib/domain/events/rules";

import { Warning2 } from "iconsax-reactjs";

/** What the website still does with a session she deleted in Google Calendar itself. */
const onSite: Partial<Record<EventPhase, string>> = {
	upcoming: "The website still shows it and takes bookings.",
	closed: "The website still shows it.",
	ongoing: "The website still shows it.",
};

/**
 * On an outdoor session's page, when her Google Calendar no longer has it:
 * what that means for the website, and the way back. Cancelling stays the
 * page's own "Cancel session".
 */
export function NotInCalendarNotice({ sessionId, phase }: { sessionId: string; phase: EventPhase }) {
	return (
		<div role="status" className="flex flex-col gap-3 rounded-2xl bg-warning/10 p-4 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
			<p className="flex gap-2">
				<Warning2 size={18} variant="Bold" className="mt-0.5 shrink-0 text-warning" />
				<span>
					<span className="font-semibold">This session was deleted from your Google Calendar.</span> {onSite[phase] ?? ""} Put it back, or
					cancel the session.
				</span>
			</p>
			<RestoreToCalendar sessionId={sessionId} />
		</div>
	);
}
