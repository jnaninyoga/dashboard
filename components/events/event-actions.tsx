"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { FormSheet } from "@/components/form-sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { restoreOutdoorEventAction } from "@/lib/actions/outdoor";
import { cancelEventAction } from "@/lib/actions/schedule/events";
import { notify, notifyActionError } from "@/lib/feedback/notify";

import { CalendarAdd, CloseCircle, Refresh } from "iconsax-reactjs";

/**
 * Puts a session deleted in Google Calendar itself back in it, as it was.
 * Its calendar id changes, so its page moves with it.
 */
export function RestoreToCalendar({ sessionId }: { sessionId: string }) {
	const router = useRouter();
	const [pending, startTransition] = useTransition();

	const restore = () =>
		startTransition(async () => {
			const result = await restoreOutdoorEventAction(sessionId);
			if (!result.success) return void notifyActionError(result, "Couldn't put the session back");
			notify.success("Back in your calendar");
			router.replace(`/schedule/outdoor/${result.googleEventId}`);
			router.refresh();
		});

	return (
		<Button onClick={restore} disabled={pending} className="h-11 shrink-0 rounded-full">
			{pending ? <Refresh className="size-4 animate-spin" /> : <CalendarAdd size={18} />}
			Put it back in my calendar
		</Button>
	);
}

/**
 * Cancels the outdoor session the way every session is cancelled (its
 * calendar event goes, its check-ins give credits back), with a reason she
 * keeps. The website marks its event cancelled; the list stays so she can
 * tell everyone.
 */
export function CancelOutdoor({ googleEventId, title }: { googleEventId: string; title: string }) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [reason, setReason] = useState("");
	const [pending, startTransition] = useTransition();

	const cancel = () =>
		startTransition(async () => {
			const result = await cancelEventAction(googleEventId, reason);
			if (!("success" in result)) return void notifyActionError(result, "Couldn't cancel the session");
			notify.success("Session cancelled", "Message the people on the list.");
			setOpen(false);
			router.refresh();
		});

	return (
		<FormSheet
			open={open}
			onOpenChange={setOpen}
			trigger={
				<Button variant="ghost" className="h-11 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive">
					<CloseCircle size={18} />
					Cancel session
				</Button>
			}
			busy={pending}
			dirty={!!reason}
			icon={<CloseCircle size={26} variant="Bulk" />}
			title={`Cancel ${title}?`}
			description="It leaves your calendar. The website shows it as cancelled and stops taking bookings. Your list stays, so you can message everyone."
			footer={
				<Button variant="destructive" onClick={cancel} disabled={pending || !reason.trim()} className="h-11 rounded-xl">
					{pending ? <Refresh className="mr-2 size-4 animate-spin" /> : null}
					Cancel the session
				</Button>
			}
		>
			<label className="grid gap-2 py-2 text-sm font-medium">
				Why
				<Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Rain forecast, moved to next Sunday…" />
			</label>
		</FormSheet>
	);
}
