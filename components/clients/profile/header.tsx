import Link from "next/link";

import { ClientActions } from "@/components/clients/actions";
import { ClientAvatar } from "@/components/clients/client-card";
import { lastVisitLabel } from "@/lib/domain/clients/card";
import { type Client } from "@/lib/types";
import { whatsappHref } from "@/lib/utils/contact";
import { cn } from "@/lib/utils/ui";

import { ArrowLeft2, Call, Danger, Whatsapp } from "iconsax-reactjs";

/**
 * The client at the top of their page: photo and name, whether they're
 * here today or when they last came, health alerts a tap away, and the
 * ways to reach them.
 */
export function ProfileHeader({
	client,
	lastVisitAt,
	hereToday,
	alerts,
	critical,
}: {
	client: Client;
	lastVisitAt?: Date | null;
	hereToday: boolean;
	/** Open health alerts, and whether one is critical. */
	alerts: number;
	critical: boolean;
}) {
	return (
		<header className="flex flex-col gap-4">
			<Link
				href="/clients"
				className="-ml-2 inline-flex min-h-10 items-center gap-1 self-start rounded-full px-2 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
			>
				<ArrowLeft2 size={16} />
				Clients
			</Link>

			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="flex min-w-0 items-center gap-4">
					<span className="relative shrink-0">
						<ClientAvatar client={client} className="size-16 text-2xl md:size-20" />
						{hereToday ? <span aria-hidden className="absolute right-0.5 bottom-0.5 size-4 rounded-full border-2 border-background bg-success" /> : null}
					</span>
					<div className="flex min-w-0 flex-col gap-1.5">
						<h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight text-foreground md:text-4xl">{client.fullName}</h1>
						<div className="flex flex-wrap items-center gap-2">
							{hereToday ? (
								<span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-success/10 px-2.5 text-sm font-medium text-success">
									<span aria-hidden className="size-1.5 rounded-full bg-success" />
									Here today
								</span>
							) : (
								<span className="text-sm text-muted-foreground">
									{lastVisitAt ? `Last visit ${lastVisitLabel(lastVisitAt)}` : "No visits yet"}
								</span>
							)}
							{alerts ? (
								<a
									href="#health"
									className={cn(
										"inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
										critical ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning",
									)}
								>
									<Danger size={14} variant="Bold" />
									{alerts} health {alerts === 1 ? "alert" : "alerts"}
								</a>
							) : null}
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<a
						href={`tel:${client.phone}`}
						aria-label={`Call ${client.fullName}`}
						className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/15 active:scale-95"
					>
						<Call size={20} variant="Bulk" />
					</a>
					<a
						href={whatsappHref(client.phone)}
						target="_blank"
						rel="noopener noreferrer"
						className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] md:flex-none"
					>
						<Whatsapp size={20} variant="Bold" />
						WhatsApp
					</a>
					<ClientActions client={client} />
				</div>
			</div>
		</header>
	);
}
