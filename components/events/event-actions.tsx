"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { FormSheet } from "@/components/form-sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cancelEventAction } from "@/lib/actions/schedule/events";
import { notify, notifyActionError } from "@/lib/feedback/notify";

import { CloseCircle, Refresh } from "iconsax-reactjs";

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
