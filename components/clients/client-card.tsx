"use client";

import { useEffect, useState } from "react";

import { EntityCard, EntityCardFigures, EntityCardHeader, Figure } from "@/components/entity-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getGoogleContactPhotoAction } from "@/lib/actions/clients/mutations";
import { creditsSummary, lastVisitLabel, shortDay } from "@/lib/domain/clients/card";
import { type Client as BaseClient, type HealthLog } from "@/lib/types";
import { whatsappHref } from "@/lib/utils/contact";
import { cn } from "@/lib/utils/ui";

import { Call, Whatsapp } from "iconsax-reactjs";

import { ClientActions } from "./actions";
import { HealthAlertButton } from "./health-alert-button";

/** What the card reads: the grid's and the list's client shapes both provide it. */
type Client = BaseClient & {
	wallets?: { status: string; remainingCredits: number; expiresOn?: string | null; product?: { credits: number | null } | null }[];
	healthLogs?: HealthLog[];
	checkedInToday?: boolean;
	activeSessionName?: string;
	visitsThisMonth?: number;
	lastVisitAt?: Date | string;
};

/** The client's photo from Google Contacts, fetched once and cached; their initial until then. */
export function ClientAvatar({ client, className }: { client: Client; className?: string }) {
	const [photoUrl, setPhotoUrl] = useState<string | null>(client.photoUrl || null);

	useEffect(() => {
		if (photoUrl || !client.googleContactResourceName) return;
		getGoogleContactPhotoAction(client.googleContactResourceName, client.id).then((res) => {
			if (res.success && res.url) setPhotoUrl(res.url);
		});
	}, [client.googleContactResourceName, client.id, photoUrl]);

	// Until a photo loads, the initial sits on the brand's teal or blush, the
	// same one for a client every time, so a page of initials isn't uniform.
	const blush = [...client.fullName].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 2 === 1;

	return (
		<Avatar className={cn("size-14", className)}>
			<AvatarImage src={photoUrl || undefined} alt={client.fullName} />
			<AvatarFallback
				className={cn(
					"text-xl font-semibold",
					blush ? "bg-secondary text-secondary-3" : "bg-primary/10 text-primary",
				)}
			>
				{client.fullName.charAt(0)}
			</AvatarFallback>
		</Avatar>
	);
}

/**
 * The one client card, in the grid and the list's phone view, in the
 * dashboard's card language (EntityCard): status sits with the name (here
 * today, health alerts), the figures she needs at the door follow, contact
 * actions close the card. Tapping anywhere else opens the profile.
 */
export function ClientCard({ client }: { client: Client }) {
	const credits = creditsSummary(client.wallets);
	const visits = client.visitsThisMonth ?? 0;
	// The list only loads active alerts.
	const alerts = client.healthLogs ?? [];

	return (
		<EntityCard
			menu={<ClientActions client={client} />}
			header={
				<EntityCardHeader
					href={`/clients/${client.id}`}
					title={client.fullName}
					media={
						<>
							<ClientAvatar client={client} />
							{client.checkedInToday ? (
								<span
									aria-hidden
									className="border-card bg-success absolute -right-0.5 -bottom-0.5 size-4 rounded-full border-2"
								/>
							) : null}
						</>
					}
				>
					{client.checkedInToday ? (
						<span className="bg-success/10 text-success inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium">
							<span aria-hidden className="bg-success size-1.5 rounded-full" />
							{client.activeSessionName ? `Here · ${client.activeSessionName}` : "Here today"}
						</span>
					) : (
						<span className="text-muted-foreground text-sm">
							{client.lastVisitAt ? `Last visit ${lastVisitLabel(client.lastVisitAt)}` : "No visits yet"}
						</span>
					)}
				</EntityCardHeader>
			}
			figures={
				<EntityCardFigures
					aside={
						alerts.length > 0 ? (
							// One clear signal with the client's figures; tap for the full list.
							<HealthAlertButton clientName={client.fullName} alerts={alerts} />
						) : (
							// The slot stays when there are no alerts, so the figures and the
							// alert sit in the same place on every card.
							<span aria-hidden className="block size-11" />
						)
					}
				>
					{credits.count === null ? (
						<Figure label="Credits left" value="No card" tone="muted" />
					) : credits.tone === "expired" ? (
						<Figure label="Card expired" value={shortDay(credits.expiredOn!)} tone="alert" />
					) : (
						<Figure
							label="Credits left"
							value={credits.count}
							unit={credits.total ? `of ${credits.total}` : undefined}
							tone={credits.tone === "low" ? "low" : undefined}
						/>
					)}
					<Figure label="This month" value={visits} unit={visits === 1 ? "visit" : "visits"} />
				</EntityCardFigures>
			}
			actions={
				<div className="flex w-full items-center gap-3">
					<a
						href={`tel:${client.phone}`}
						aria-label={`Call ${client.fullName}`}
						className="bg-primary/10 text-primary hover:bg-primary/15 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors active:scale-95"
					>
						<Call size={20} variant="Bulk" />
					</a>
					<a
						href={whatsappHref(client.phone)}
						target="_blank"
						rel="noopener noreferrer"
						className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-11 flex-1 items-center justify-center gap-2 rounded-full font-semibold transition-colors active:scale-[0.98]"
					>
						<Whatsapp size={20} variant="Bold" />
						WhatsApp
					</a>
				</div>
			}
		/>
	);
}
