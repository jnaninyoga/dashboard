"use client";

import { useEffect, useState } from "react";

import { EntityCard, EntityCardFigures, EntityCardHeader, Figure } from "@/components/entity-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getGoogleContactPhotoAction } from "@/lib/actions/clients/mutations";
import { alertChipLabel, alertsSummary, creditsSummary, lastVisitLabel } from "@/lib/domain/clients/card";
import { notify } from "@/lib/feedback/notify";
import { type Client as BaseClient, type HealthLog } from "@/lib/types";
import { whatsappHref } from "@/lib/utils/contact";
import { cn } from "@/lib/utils/ui";

import { Call, Danger, Whatsapp } from "iconsax-reactjs";

import { ClientActions } from "./actions";

/** What the card reads: the grid's and the list's client shapes both provide it. */
type Client = BaseClient & {
	wallets?: { remainingCredits: number; product?: { defaultCredits: number } | null }[];
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
					blush ? "bg-secondary text-secondary-3 dark:text-foreground/85" : "bg-primary/10 text-primary",
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
	const credits = creditsSummary(client.wallets?.[0]);
	const visits = client.visitsThisMonth ?? 0;
	// The list only loads active alerts.
	const alerts = client.healthLogs ?? [];
	const showAlerts = () =>
		notify.warning(`Health alerts for ${client.fullName}`, alertsSummary(alerts), 8000);

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
									className="border-card absolute -right-0.5 -bottom-0.5 size-4 rounded-full border-2 bg-green-500"
								/>
							) : null}
						</>
					}
				>
					{client.checkedInToday ? (
						<span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-green-100 px-2.5 text-sm font-medium text-green-800 dark:bg-green-500/15 dark:text-green-300">
							<span aria-hidden className="size-1.5 rounded-full bg-green-600 dark:bg-green-400" />
							{client.activeSessionName ? `Here · ${client.activeSessionName}` : "Here today"}
						</span>
					) : (
						<span className="text-muted-foreground text-sm">
							{client.lastVisitAt ? `Last visit ${lastVisitLabel(client.lastVisitAt)}` : "No visits yet"}
						</span>
					)}
					{alerts.length > 0 ? (
						<button
							type="button"
							onClick={showAlerts}
							aria-label={`Health alerts for ${client.fullName}: ${alertsSummary(alerts)}`}
							className="relative z-10 inline-flex h-7 max-w-full items-center gap-1 rounded-full bg-red-50 px-2.5 text-sm font-medium text-red-700 ring-1 ring-red-200 transition-colors ring-inset hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30"
						>
							<Danger size={14} variant="Bold" className="shrink-0" />
							<span className="truncate">{alertChipLabel(alerts)}</span>
						</button>
					) : null}
				</EntityCardHeader>
			}
			figures={
				<EntityCardFigures>
					{credits.count === null ? (
						<Figure label="Credits left" value="No active card" tone="muted" />
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
