"use client";

import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { creditsSummary, lastVisitLabel } from "@/lib/domain/clients/card";
import { formatPhone, whatsappHref } from "@/lib/utils/contact";
import { cn } from "@/lib/utils/ui";
import {
	type Client,
	type ClientCategory,
	type ClientWallet,
	type HealthLog,
	type MembershipProduct,
} from "@/services/database/schema";

import { type ColumnDef } from "@tanstack/react-table";
import { Call, People, Whatsapp } from "iconsax-reactjs";

import { ClientActions } from "./actions";
import { ClientAvatar, ClientCard } from "./client-card";
import { HealthAlertButton } from "./health-alert-button";

export type ClientWithRelations = Client & {
	category?: ClientCategory | null;
	wallets?: (ClientWallet & { product?: MembershipProduct | null })[];
	healthLogs?: HealthLog[];
	/** Check-ins since the start of the studio's month, and the latest one. */
	visitsThisMonth?: number;
	lastVisitAt?: Date | string;
	checkedInToday?: boolean;
	activeSessionName?: string;
};

// The figure columns keep the card's breathing room between them.
const figureColumn = "px-5";

const contactButton =
	"flex size-9 shrink-0 items-center justify-center rounded-full transition-colors active:scale-95";

// The same facts as the client card, as columns: who, when they last came,
// credits, visits, health, how to reach them.
const columns: ColumnDef<ClientWithRelations>[] = [
	{
		id: "client",
		accessorKey: "fullName",
		header: "Client",
		// The client column takes the spare width; the name shortens only when
		// the table has no room left.
		meta: { className: "w-full max-w-0" },
		cell: ({ row }) => {
			const client = row.original;
			return (
				<div className="flex min-w-52 items-center gap-3">
					<div className="relative shrink-0">
						<ClientAvatar client={client} className="size-10" />
						{client.checkedInToday ? (
							<span
								aria-hidden
								className="border-card bg-success absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2"
							/>
						) : null}
					</div>
					{/* A real link, so the profile is reachable by keyboard too. */}
					<Link
						href={`/clients/${client.id}`}
						title={client.fullName}
						className="text-foreground hover:text-primary focus-visible:ring-ring truncate rounded-sm font-medium transition-colors outline-none focus-visible:ring-2"
					>
						{client.fullName}
					</Link>
				</div>
			);
		},
	},
	{
		id: "lastVisit",
		meta: { className: figureColumn },
		header: "Last visit",
		// Here today sorts first, then the most recent visits.
		accessorFn: (c) =>
			c.checkedInToday ? Number.MAX_SAFE_INTEGER : c.lastVisitAt ? new Date(c.lastVisitAt).getTime() : 0,
		sortDescFirst: true,
		cell: ({ row }) => {
			const c = row.original;
			if (c.checkedInToday) {
				return (
					<span className="bg-success/10 text-success inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium">
						<span aria-hidden className="bg-success size-1.5 rounded-full" />
						{c.activeSessionName ? `Here · ${c.activeSessionName}` : "Here today"}
					</span>
				);
			}
			return (
				<span className="text-muted-foreground">{c.lastVisitAt ? lastVisitLabel(c.lastVisitAt) : "No visits yet"}</span>
			);
		},
	},
	{
		id: "credits",
		meta: { className: figureColumn },
		header: "Credits left",
		accessorFn: (c) => c.wallets?.[0]?.remainingCredits ?? -1,
		cell: ({ row }) => {
			const credits = creditsSummary(row.original.wallets?.[0]);
			if (credits.count === null) return <span className="text-muted-foreground">No card</span>;
			return (
				<span className="flex items-baseline gap-1">
					<span
						className={cn(
							"font-semibold tabular-nums",
							credits.tone === "low" && "text-warning",
						)}
					>
						{credits.count}
					</span>
					{credits.total ? <span className="text-muted-foreground text-sm">of {credits.total}</span> : null}
				</span>
			);
		},
	},
	{
		id: "visits",
		meta: { className: figureColumn },
		header: "This month",
		accessorFn: (c) => c.visitsThisMonth ?? 0,
		sortDescFirst: true,
		cell: ({ row }) => {
			const visits = row.original.visitsThisMonth ?? 0;
			return (
				<span className="flex items-baseline gap-1">
					<span className="font-semibold tabular-nums">{visits}</span>
					<span className="text-muted-foreground text-sm">{visits === 1 ? "visit" : "visits"}</span>
				</span>
			);
		},
	},
	{
		id: "health",
		header: "Health",
		accessorFn: (c) => c.healthLogs?.length ?? 0,
		sortDescFirst: true,
		cell: ({ row }) => {
			const alerts = row.original.healthLogs ?? [];
			// Only a signal when there is something to see, as on the card.
			return alerts.length > 0 ? (
				<HealthAlertButton clientName={row.original.fullName} alerts={alerts} className="size-9 ring-2" />
			) : null;
		},
	},
	{
		id: "contact",
		header: "Contact",
		enableSorting: false,
		cell: ({ row }) => {
			const c = row.original;
			return (
				<div className="flex items-center gap-2">
					<a
						href={`tel:${c.phone}`}
						aria-label={`Call ${c.fullName}`}
						className={cn(contactButton, "bg-primary/10 text-primary hover:bg-primary/15")}
					>
						<Call size={18} variant="Bulk" />
					</a>
					<a
						href={whatsappHref(c.phone)}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={`WhatsApp ${c.fullName}`}
						className={cn(contactButton, "bg-primary text-primary-foreground hover:bg-primary/90")}
					>
						<Whatsapp size={18} variant="Bold" />
					</a>
					<span className="text-muted-foreground ml-1 hidden text-sm tabular-nums 2xl:inline">{formatPhone(c.phone)}</span>
				</div>
			);
		},
	},
	{
		id: "actions",
		header: "",
		enableSorting: false,
		cell: ({ row }) => (
			<div className="flex justify-end">
				<ClientActions client={row.original} />
			</div>
		),
	},
];

export function ClientsTable({ clients }: { clients: ClientWithRelations[] }) {
	return (
		<DataTable
			data={clients}
			columns={columns}
			noun={{ one: "client", many: "clients" }}
			getRowHref={(client) => `/clients/${client.id}`}
			initialSorting={[{ id: "lastVisit", desc: true }]}
			empty={
				<EmptyState
					icon={<People size={40} variant="Bulk" />}
					title="No clients found"
					description="Adjust your filters, or add a new client."
				/>
			}
			renderCard={(client) => <ClientCard client={client} />}
			cardIsSelfContained
			// The table needs about 1280px with the sidebar open; below, the cards.
			cardsBelow="xl"
		/>
	);
}
