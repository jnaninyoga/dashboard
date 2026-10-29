"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getGoogleContactPhotoAction } from "@/lib/actions/clients/mutations";
import { alertsSummary, clientSinceLabel, creditsSummary, lastVisitLabel } from "@/lib/domain/clients/card";
import { notify } from "@/lib/feedback/notify";
import { type Client as BaseClient, type HealthLog } from "@/lib/types";
import { whatsappHref } from "@/lib/utils/contact";
import { cn } from "@/lib/utils/ui";

import { Calendar, Call, Danger, Ticket, Whatsapp } from "iconsax-reactjs";

import { ClientActions } from "./actions";

/** What the card reads: the grid's and the list's client shapes both provide it. */
type Client = BaseClient & {
	wallets?: {
		remainingCredits: number;
		product?: { defaultCredits: number } | null;
		ledgerEntries?: { checkInTime: Date | string }[];
	}[];
	healthLogs?: HealthLog[];
	checkedInToday?: boolean;
	activeSessionName?: string;
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

	return (
		<Avatar className={cn("size-14", className)}>
			<AvatarImage src={photoUrl || undefined} alt={client.fullName} />
			<AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
				{client.fullName.charAt(0)}
			</AvatarFallback>
		</Avatar>
	);
}

/**
 * The one client card, in the grid and the list's phone view. It answers what
 * she needs at the door (credits left, last visit, health alerts) and leads
 * to what she does next (WhatsApp, call). Tapping anywhere else opens the
 * profile; membership details, gender and category live there.
 */
export function ClientCard({ client }: { client: Client }) {
	const wallet = client.wallets?.[0];
	const credits = creditsSummary(wallet);
	const lastVisit = lastVisitLabel(wallet?.ledgerEntries?.[0]?.checkInTime);
	// The list only loads active alerts.
	const alerts = client.healthLogs ?? [];
	const showAlerts = () =>
		notify.warning(`Health alerts for ${client.fullName}`, alertsSummary(alerts), 8000);

	return (
		<article className="bg-card zen-shadow-sm hover:border-primary/25 relative overflow-hidden rounded-3xl border p-5 transition-colors">
			{/* A soft teal wash rising from the bottom, the brand's light. */}
			<div
				aria-hidden
				className="from-accent/55 pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t to-transparent"
			/>

			<div className="relative flex flex-col gap-4">
				<div className="flex items-center gap-4">
					<div className="relative shrink-0">
						<ClientAvatar client={client} />
						{client.checkedInToday ? (
							<span
								aria-hidden
								className="border-card absolute -right-0.5 -bottom-0.5 size-4 rounded-full border-2 bg-green-500"
							/>
						) : null}
					</div>
					<div className="flex min-w-0 flex-col items-start gap-1">
						{/* The name's link covers the whole card; the buttons sit above it. */}
						<Link
							href={`/clients/${client.id}`}
							className="text-foreground focus-visible:after:ring-ring text-lg leading-snug font-semibold outline-none after:absolute after:-inset-5 after:rounded-3xl focus-visible:after:ring-2"
						>
							{client.fullName}
						</Link>
						{client.checkedInToday ? (
							<span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800">
								<span aria-hidden className="size-1.5 rounded-full bg-green-600" />
								{client.activeSessionName ? `Checked in · ${client.activeSessionName}` : "Checked in today"}
							</span>
						) : null}
					</div>
				</div>

				<dl className="bg-accent/35 grid grid-cols-2 gap-4 rounded-2xl p-4">
					<div className="flex flex-col gap-1">
						<dt className="text-muted-foreground flex items-center gap-1.5 text-sm">
							<Ticket size={16} variant="Bulk" className="text-primary" />
							Credits left
						</dt>
						<dd
							className={cn(
								"tabular-nums",
								credits.tone === "none"
									? "text-muted-foreground text-base font-medium"
									: "text-2xl font-semibold",
								credits.tone === "low" && "text-amber-700",
							)}
						>
							{credits.value}
						</dd>
					</div>
					<div className="flex flex-col gap-1">
						<dt className="text-muted-foreground flex items-center gap-1.5 text-sm">
							<Calendar size={16} variant="Bulk" className="text-primary" />
							Last visit
						</dt>
						<dd className="text-xl font-semibold">{lastVisit}</dd>
					</div>
				</dl>

				{alerts.length > 0 ? (
					<button
						type="button"
						onClick={showAlerts}
						aria-label={`Health alerts for ${client.fullName}`}
						className="relative z-10 flex h-11 items-center gap-2 self-start rounded-full bg-red-100 px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-200 active:scale-[0.98]"
					>
						<Danger size={18} variant="Bulk" />
						{alerts.length} health {alerts.length === 1 ? "alert" : "alerts"}
					</button>
				) : null}

				<div className="flex items-center justify-between text-sm">
					<span className="text-foreground">Client since</span>
					<span className="text-muted-foreground">{clientSinceLabel(client.createdAt)}</span>
				</div>

				<div className="relative z-10 flex items-center gap-3">
					<ClientActions
						client={client}
						triggerClassName="bg-card size-12 rounded-full border shadow-sm md:size-12"
					/>
					<a
						href={`tel:${client.phone}`}
						aria-label={`Call ${client.fullName}`}
						className="bg-card text-primary hover:bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-full border shadow-sm transition-colors active:scale-95"
					>
						<Call size={20} variant="Bulk" />
					</a>
					<a
						href={whatsappHref(client.phone)}
						target="_blank"
						rel="noopener noreferrer"
						className="from-primary text-primary-foreground zen-glow-teal flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r to-[color-mix(in_oklab,var(--color-primary)_70%,var(--color-accent))] font-semibold transition-[filter] hover:brightness-105 active:scale-[0.98]"
					>
						<Whatsapp size={20} variant="Bold" />
						WhatsApp
					</a>
				</div>
			</div>
		</article>
	);
}
