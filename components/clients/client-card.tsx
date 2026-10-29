"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getGoogleContactPhotoAction } from "@/lib/actions/clients/mutations";
import { alertsSummary, creditsSummary, lastVisitLabel } from "@/lib/domain/clients/card";
import { notify } from "@/lib/feedback/notify";
import { type Client as BaseClient, type HealthLog } from "@/lib/types";
import { whatsappHref } from "@/lib/utils/contact";
import { cn } from "@/lib/utils/ui";

import { Call, Danger, TickCircle, Whatsapp } from "iconsax-reactjs";

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

/** One figure in the card's panel: a label, a large number and its unit. */
function Figure({ label, value, unit, tone }: { label: string; value: React.ReactNode; unit?: string; tone?: "low" }) {
	return (
		<div className="flex min-w-0 flex-col gap-1">
			<dt className="text-muted-foreground text-sm">{label}</dt>
			<dd className="flex items-baseline gap-1.5">
				<span className={cn("text-2xl leading-none font-semibold tabular-nums", tone === "low" && "text-amber-700 dark:text-amber-400")}>
					{value}
				</span>
				{unit ? <span className="text-muted-foreground text-sm">{unit}</span> : null}
			</dd>
		</div>
	);
}

/**
 * The one client card, in the grid and the list's phone view. It answers what
 * she needs at the door (credits left, how often they come, health alerts)
 * and leads to what she does next (WhatsApp, call). Tapping anywhere else
 * opens the profile; membership details, gender and category live there.
 */
export function ClientCard({ client }: { client: Client }) {
	const credits = creditsSummary(client.wallets?.[0]);
	const visits = client.visitsThisMonth ?? 0;
	// The list only loads active alerts.
	const alerts = client.healthLogs ?? [];
	const showAlerts = () =>
		notify.warning(`Health alerts for ${client.fullName}`, alertsSummary(alerts), 8000);

	return (
		<article className="bg-card zen-shadow-sm hover:border-primary/25 relative flex h-full flex-col overflow-hidden rounded-3xl border p-5 transition-colors">
			{/* A soft teal wash rising from the bottom, the brand's light. */}
			<div
				aria-hidden
				className="from-accent/45 pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent"
			/>

			<div className="relative flex flex-1 flex-col gap-4">
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
							<span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800 dark:bg-green-500/15 dark:text-green-300">
								<span aria-hidden className="size-1.5 rounded-full bg-green-600 dark:bg-green-400" />
								{client.activeSessionName ? `Here today · ${client.activeSessionName}` : "Here today"}
							</span>
						) : (
							<span className="text-muted-foreground text-sm">
								{client.lastVisitAt ? `Last visit ${lastVisitLabel(client.lastVisitAt)}` : "No visits yet"}
							</span>
						)}
					</div>
				</div>

				<dl className="bg-accent/35 grid grid-cols-2 gap-4 rounded-2xl p-4">
					{credits.count === null ? (
						<div className="flex flex-col gap-1">
							<dt className="text-muted-foreground text-sm">Credits left</dt>
							<dd className="text-muted-foreground pt-1 text-base font-medium">No active card</dd>
						</div>
					) : (
						<Figure
							label="Credits left"
							value={credits.count}
							unit={credits.total ? `of ${credits.total}` : undefined}
							tone={credits.tone === "low" ? "low" : undefined}
						/>
					)}
					<Figure label="This month" value={visits} unit={visits === 1 ? "visit" : "visits"} />
				</dl>

				{/* Always present, so every card has the same rhythm; "no alerts" is worth knowing too. */}
				{alerts.length > 0 ? (
					<button
						type="button"
						onClick={showAlerts}
						aria-label={`Health alerts for ${client.fullName}`}
						className="relative z-10 flex h-11 items-center gap-2 self-start rounded-full bg-red-100 px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-200 active:scale-[0.98] dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25"
					>
						<Danger size={18} variant="Bulk" />
						{alerts.length} health {alerts.length === 1 ? "alert" : "alerts"}
					</button>
				) : (
					<p className="text-muted-foreground flex h-11 items-center gap-2 px-1 text-sm">
						<TickCircle size={18} variant="Bulk" className="text-green-600 dark:text-green-400" />
						No health alerts
					</p>
				)}

				{/* Always at the bottom, so the actions line up across a row of cards. */}
				<div className="relative z-10 mt-auto flex items-center gap-3 pt-1">
					<ClientActions
						client={client}
						triggerClassName="bg-card text-foreground size-12 rounded-full border shadow-sm md:size-12"
						prominentTrigger
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
						className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-12 flex-1 items-center justify-center gap-2 rounded-full font-semibold shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_6px_16px_-6px_color-mix(in_oklab,var(--color-primary)_60%,transparent)] transition-colors active:scale-[0.98]"
					>
						<Whatsapp size={20} variant="Bold" />
						WhatsApp
					</a>
				</div>
			</div>
		</article>
	);
}
