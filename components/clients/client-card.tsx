"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getGoogleContactPhotoAction } from "@/lib/actions/clients/mutations";
import { alertsSummary, creditsLine } from "@/lib/domain/clients/card";
import { notify } from "@/lib/feedback/notify";
import { type Client as BaseClient, type HealthLog } from "@/lib/types";
import { whatsappHref } from "@/lib/utils/contact";
import { cn } from "@/lib/utils/ui";

import { Call, Danger, Whatsapp } from "iconsax-reactjs";

import { ClientActions } from "./actions";

/** What the card reads: the grid's and the list's client shapes both provide it. */
type Client = BaseClient & {
	wallets?: { remainingCredits: number }[];
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
		<Avatar className={cn("size-11", className)}>
			<AvatarImage src={photoUrl || undefined} alt={client.fullName} />
			<AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
				{client.fullName.charAt(0)}
			</AvatarFallback>
		</Avatar>
	);
}

const actionButton =
	"flex size-10 shrink-0 items-center justify-center rounded-full transition-colors active:scale-95";

/**
 * The one client card, in the grid and the list's phone view: who, how many
 * credits are left, whether they came today, and what she does from the list
 * (read health alerts, WhatsApp, call). Tapping anywhere else opens the
 * profile. Two rows when the card is narrow, one row when there's room.
 */
export function ClientCard({ client }: { client: Client }) {
	const credits = creditsLine(client.wallets?.[0]);
	// The list only loads active alerts.
	const alerts = client.healthLogs ?? [];
	const showAlerts = () =>
		notify.warning(`Health alerts for ${client.fullName}`, alertsSummary(alerts), 8000);

	return (
		<article className="@container">
			<div className="bg-card zen-shadow-sm hover:border-primary/30 relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-2xl border p-3 transition-colors @md:grid-cols-[auto_minmax(0,1fr)_auto_auto]">
				<div className="relative">
					<ClientAvatar client={client} />
					{client.checkedInToday ? (
						<span
							aria-hidden
							className="border-card absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 bg-green-500"
						/>
					) : null}
				</div>

				<div className="min-w-0">
					{/* The name's link covers the whole card; the buttons sit above it. */}
					<Link
						href={`/clients/${client.id}`}
						className="text-foreground focus-visible:after:ring-ring block truncate font-semibold outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2"
					>
						{client.fullName}
					</Link>
					<p className="truncate text-sm">
						<span
							className={cn(
								credits.tone === "low" ? "font-medium text-amber-700" : "text-muted-foreground",
							)}
						>
							{credits.text}
						</span>
						{client.checkedInToday ? (
							<span className="text-green-700">
								{" · "}
								{client.activeSessionName ? `In ${client.activeSessionName}` : "Checked in"}
							</span>
						) : null}
					</p>
				</div>

				<div className="relative z-10 col-span-2 col-start-2 row-start-2 flex items-center gap-2 @md:col-span-1 @md:col-start-3 @md:row-start-1">
					{alerts.length > 0 ? (
						<button
							type="button"
							onClick={showAlerts}
							aria-label={`Health alerts for ${client.fullName}`}
							className="flex h-10 items-center gap-1.5 rounded-full bg-red-100 px-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-200 active:scale-95"
						>
							<Danger className="size-5" variant="Bulk" />
							{alerts.length} {alerts.length === 1 ? "alert" : "alerts"}
						</button>
					) : null}
					<a
						href={whatsappHref(client.phone)}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={`WhatsApp ${client.fullName}`}
						className={cn(actionButton, "bg-[#25D366]/12 text-[#1a8f47] hover:bg-[#25D366]/20")}
					>
						<Whatsapp className="size-5" variant="Bulk" />
					</a>
					<a
						href={`tel:${client.phone}`}
						aria-label={`Call ${client.fullName}`}
						className={cn(actionButton, "bg-primary/10 text-primary hover:bg-primary/15")}
					>
						<Call className="size-5" variant="Bulk" />
					</a>
				</div>

				<div className="relative z-10 col-start-3 row-start-1 @md:col-start-4">
					<ClientActions client={client} />
				</div>
			</div>
		</article>
	);
}
