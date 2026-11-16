"use client";

import { EntityCard, EntityCardFigures, EntityCardHeader, Figure } from "@/components/entity-card";
import { type RequestView } from "@/lib/actions/requests/queries";
import { messageExcerpt } from "@/lib/domain/requests/choice";
import { cn } from "@/lib/utils/ui";

import { DirectInbox, Profile2User } from "iconsax-reactjs";

import { BookingChoiceLine } from "./booking-choice";
import { requestTitle } from "./labels";
import { RequestMenu, RequestReplyActions } from "./request-actions";
import { RequestStatus } from "./request-status";

/** The client it's from, or that this person is new to the studio. */
export function RequestClientFigure({ request }: { request: RequestView }) {
	if (!request.client) {
		return <Figure label="Client" value={request.erasedAt ? "—" : "New to the studio"} tone="muted" />;
	}
	const { credits } = request.client;
	return (
		<Figure
			label="Card"
			value={credits.count === null ? "No card" : credits.tone === "expired" ? "Expired" : credits.count}
			unit={credits.count !== null && credits.tone !== "expired" ? (credits.total ? `of ${credits.total} credits` : "credits") : undefined}
			tone={credits.count === null ? "muted" : credits.tone === "expired" ? "alert" : credits.tone === "low" ? "low" : undefined}
		/>
	);
}

/**
 * A booking from the website in the dashboard's card language: who and
 * what (with the status next to the name), whether they're already a
 * client, then the next step (reply on WhatsApp, confirm).
 */
export function RequestCard({ request }: { request: RequestView }) {
	return (
		<EntityCard
			menu={<RequestMenu request={request} />}
			header={
				<EntityCardHeader
					href={`/bookings/${request.id}`}
					title={requestTitle(request)}
					media={
						<div
							className={cn(
								"flex size-14 items-center justify-center rounded-2xl",
								request.status === "new" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
							)}
						>
							{request.client ? <Profile2User size={28} variant="Bulk" /> : <DirectInbox size={28} variant="Bulk" />}
						</div>
					}
				>
					<RequestStatus status={request.status} />
					<BookingChoiceLine request={request} className="basis-full" />
					{request.kind === "event" && request.partySize > 1 ? (
						<span className="basis-full text-sm text-foreground">For {request.partySize} people</span>
					) : null}
					{request.message ? (
						<span className="line-clamp-2 basis-full text-sm text-muted-foreground italic">“{messageExcerpt(request.message)}”</span>
					) : null}
				</EntityCardHeader>
			}
			figures={
				<EntityCardFigures>
					<Figure label="Received" value={request.received} tone="muted" />
					<RequestClientFigure request={request} />
				</EntityCardFigures>
			}
			actions={<RequestReplyActions request={request} />}
		/>
	);
}
