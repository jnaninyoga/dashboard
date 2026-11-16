"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { FormSheet } from "@/components/form-sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cancelEventAction, syncEventCalendarAction } from "@/lib/actions/events";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { notifyWebsite } from "@/lib/feedback/website";

import { Calendar, CloseCircle, Refresh } from "iconsax-reactjs";

/** Cancels the event with a reason she keeps: the website marks it cancelled, and its list stays so she can tell everyone. */
export function CancelEvent({ id, title }: { id: string; title: string }) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [reason, setReason] = useState("");
	const [pending, startTransition] = useTransition();

	const cancel = () =>
		startTransition(async () => {
			const result = await cancelEventAction(id, reason);
			if (result.error) return void notifyActionError(result, "Couldn't cancel the event");
			notify.success("Event cancelled", "Message the people on the list.");
			notifyWebsite(result.website);
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
					Cancel event
				</Button>
			}
			busy={pending}
			dirty={!!reason}
			icon={<CloseCircle size={26} variant="Bulk" />}
			title={`Cancel ${title}?`}
			description="The website shows it as cancelled and stops taking bookings. Your list stays, so you can message everyone."
			footer={
				<Button variant="destructive" onClick={cancel} disabled={pending || !reason.trim()} className="h-11 rounded-xl">
					{pending ? <Refresh className="mr-2 size-4 animate-spin" /> : null}
					Cancel the event
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

/** "Not in your calendar yet", with a retry, for a published event Google missed. */
export function CalendarRetry({ id }: { id: string }) {
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	return (
		<Button
			variant="outline"
			disabled={pending}
			onClick={() =>
				startTransition(async () => {
					const result = await syncEventCalendarAction(id);
					if (result.error) return void notifyActionError(result, "Couldn't reach Google Calendar");
					notify.success("In your calendar");
					router.refresh();
				})
			}
			className="h-11 rounded-full"
		>
			{pending ? <Refresh className="mr-2 size-4 animate-spin" /> : <Calendar size={18} className="mr-2" />}
			Not in your calendar yet: add it
		</Button>
	);
}
