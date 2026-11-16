"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useConfirm } from "@/components/feedback/confirm";
import { replyHref } from "@/components/requests/labels";
import { RowActionsTrigger } from "@/components/row-actions-trigger";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { eraseRequestAction, setRequestStatusAction } from "@/lib/actions/requests/mutations";
import { type RequestView } from "@/lib/actions/requests/queries";
import { toE164 } from "@/lib/domain/requests/phone";
import { contactOf } from "@/lib/domain/requests/reply";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { cn } from "@/lib/utils/ui";

import { ArrowRotateLeft, Call, CloseCircle, Eraser, TickCircle, UserAdd, Whatsapp } from "iconsax-reactjs";

type Status = RequestView["status"];

const DONE: Record<Status, string> = {
	new: "Back among the new bookings",
	confirmed: "Booking confirmed",
	declined: "Booking declined",
};

function useRequestActions(request: RequestView) {
	const router = useRouter();
	const confirm = useConfirm();
	const [pending, startTransition] = useTransition();

	const setStatus = (status: Status) =>
		startTransition(async () => {
			const result = await setRequestStatusAction(request.id, status);
			if (result.error) return void notifyActionError(result, "Couldn't change the booking");
			notify.success(DONE[status]);
			router.refresh();
		});

	const erase = async () => {
		const ok = await confirm({
			title: `Erase ${request.name || "these"} details?`,
			description: "Their name, phone and message are removed for good. The booking stays in your counts.",
			confirmLabel: "Erase",
			destructive: true,
		});
		if (!ok) return;
		startTransition(async () => {
			const result = await eraseRequestAction(request.id);
			if (result.error) return void notifyActionError(result, "Couldn't erase the details");
			notify.success("Details erased");
			router.refresh();
		});
	};

	return { pending, setStatus, erase };
}

// Two side by side on a phone card: they share the width and shrink before they overflow.
const pill =
	"flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-3 font-semibold whitespace-nowrap transition-colors active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 [&>svg]:shrink-0";

/**
 * The next step: reply on WhatsApp, then confirm. A handled request offers
 * to put it back among the new ones instead.
 */
export function RequestReplyActions({ request, className }: { request: RequestView; className?: string }) {
	const { pending, setStatus } = useRequestActions(request);
	const href = replyHref(request);
	return (
		<div className={cn("flex w-full items-center gap-2", className)}>
			{href ? (
				<a
					href={href}
					target="_blank"
					rel="noopener noreferrer"
					aria-label={`Reply to ${request.name} on WhatsApp`}
					className={cn(pill, "bg-[#25D366]/15 text-[#128C7E] hover:bg-[#25D366]/25")}
				>
					<Whatsapp size={20} variant="Bold" />
					WhatsApp
				</a>
			) : null}
			{request.status === "new" ? (
				<button
					type="button"
					disabled={pending}
					onClick={() => setStatus("confirmed")}
					className={cn(pill, "bg-primary text-primary-foreground hover:bg-primary/90")}
				>
					<TickCircle size={20} variant="Bold" />
					Confirm
				</button>
			) : (
				<button
					type="button"
					disabled={pending}
					onClick={() => setStatus("new")}
					className={cn(pill, "bg-secondary/30 text-foreground hover:bg-secondary/50")}
				>
					<ArrowRotateLeft size={20} />
					Back to new
				</button>
			)}
		</div>
	);
}

/** The ⋮ menu: call, the other statuses, add as client, and erase the person's details. */
export function RequestMenu({ request }: { request: RequestView }) {
	const { pending, setStatus, erase } = useRequestActions(request);
	const contact = contactOf(request);
	const label = request.name || "this booking";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<RowActionsTrigger label={`Actions for ${label}`} disabled={pending} />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				{contact ? (
					<DropdownMenuItem asChild>
						<a href={`tel:${toE164(contact.phone) ?? contact.phone}`}>
							<Call size={18} />
							Call {contact.name.split(" ")[0]}
						</a>
					</DropdownMenuItem>
				) : null}
				{request.status !== "confirmed" ? (
					<DropdownMenuItem onSelect={() => setStatus("confirmed")}>
						<TickCircle size={18} />
						Confirm
					</DropdownMenuItem>
				) : null}
				{request.status !== "declined" ? (
					<DropdownMenuItem onSelect={() => setStatus("declined")}>
						<CloseCircle size={18} />
						Decline
					</DropdownMenuItem>
				) : null}
				{request.status !== "new" ? (
					<DropdownMenuItem onSelect={() => setStatus("new")}>
						<ArrowRotateLeft size={18} />
						Back to new
					</DropdownMenuItem>
				) : null}
				{contact && !request.client ? (
					<DropdownMenuItem asChild>
						<Link href={`/clients/add?fromBooking=${request.id}`}>
							<UserAdd size={18} />
							Add as client
						</Link>
					</DropdownMenuItem>
				) : null}
				{contact ? (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem variant="destructive" onSelect={() => void erase()}>
							<Eraser size={18} />
							Erase personal details
						</DropdownMenuItem>
					</>
				) : null}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
