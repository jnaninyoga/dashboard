"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { getGoogleContactPhotoAction } from "@/lib/actions/clients/mutations";
import { 
    type Client, 
    type ClientCategory, 
    type ClientWallet, 
    type HealthLog, 
    type MembershipProduct 
} from "@/services/database/schema";

import { type ColumnDef } from "@tanstack/react-table";
import { 
    Call as Phone, 
    Card, 
    Danger, 
    People,
    Sms as Mail, 
    TickCircle, 
    User, 
	Whatsapp
} from "iconsax-reactjs";

import { ClientActions } from "./actions";

export type ClientWithRelations = Client & {
    category?: ClientCategory | null;
    wallets?: (ClientWallet & { product?: MembershipProduct | null })[];
    healthLogs?: HealthLog[];
    activeSessionName?: string;
};

function ClientAvatar({ client }: { client: ClientWithRelations }) {
	const [photoUrl, setPhotoUrl] = useState<string | null>(client.photoUrl || null);

	useEffect(() => {
		// Skip API call if we already have a cached photo URL
		if (photoUrl) return;

		if (client.googleContactResourceName) {
			getGoogleContactPhotoAction(client.googleContactResourceName, client.id).then(
				(res) => {
					if (res.success && res.url) {
						setPhotoUrl(res.url);
					}
				},
			);
		}
	}, [client.googleContactResourceName, client.id, photoUrl]);

	return (
		<Avatar className="h-9 w-9">
			<AvatarImage src={photoUrl || undefined} alt={client.fullName} />
			<AvatarFallback className="bg-primary/10 text-primary font-bold">{client.fullName.charAt(0)}</AvatarFallback>
		</Avatar>
	);
}

const alertsOf = (client: ClientWithRelations) => client.healthLogs?.filter((l) => l.isAlert) || [];
const whatsappHref = (phone: string) => `https://wa.me/${phone.replace(/[^0-9]/g, "")}`;

function LiveBadge({ name }: { name: string }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-green-700 shadow-sm">
					<span className="relative flex h-1 w-1">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
						<span className="relative inline-flex h-1 w-1 rounded-full bg-green-500"></span>
					</span>
					<span className="max-w-[80px] truncate text-[8px] font-black tracking-widest uppercase">{name}</span>
				</div>
			</TooltipTrigger>
			<TooltipContent>
				<p className="text-xs font-semibold text-green-600">Present in the club today</p>
			</TooltipContent>
		</Tooltip>
	);
}

function MembershipBadge({ client }: { client: ClientWithRelations }) {
	const wallet = client.wallets?.[0];
	return wallet ? (
		<Badge className="bg-primary/90 hover:bg-primary gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase shadow-sm">
			<Card size={10} variant="Bold" className="text-white opacity-80" />
			{wallet.remainingCredits} / {wallet.product?.defaultCredits || 0}
		</Badge>
	) : (
		<span className="text-muted-foreground/30 text-[10px] font-bold tracking-widest uppercase italic">No Pack</span>
	);
}

const columns: ColumnDef<ClientWithRelations>[] = [
	{
		id: "client",
		accessorKey: "fullName",
		header: "Client",
		cell: ({ row }) => {
			const client = row.original;
			return (
				<div className="flex items-center gap-4">
					<Link href={`/clients/${client.id}`} className="group/avatar relative shrink-0">
						<ClientAvatar client={client} />
						{client.activeSessionName ? (
							<span className="absolute -right-0.5 -bottom-0.5 block h-3 w-3 rounded-full border-2 border-white bg-green-500 shadow-sm" />
						) : null}
					</Link>
					<div className="flex min-w-0 items-center gap-2">
						<Link
							href={`/clients/${client.id}`}
							className="text-foreground group-hover:text-primary truncate text-sm font-bold tracking-tight transition-colors"
						>
							{client.fullName}
						</Link>
						{client.activeSessionName ? <LiveBadge name={client.activeSessionName} /> : null}
					</div>
				</div>
			);
		},
	},
	{
		id: "gender",
		header: "Gender",
		enableSorting: false,
		cell: ({ row }) => {
			const gender = row.original.gender;
			return (
				<div className="flex items-center gap-2 font-medium">
					{gender === "male" || gender === "female" ? (
						<>
							<User className={gender === "male" ? "size-4 text-blue-500" : "size-4 text-pink-500"} variant="Bulk" />
							<span className="text-foreground text-xs capitalize">{gender}</span>
						</>
					) : (
						<>
							<User className="text-muted-foreground/40 size-4" variant="Outline" />
							<span className="text-muted-foreground/60 text-xs">Unspecified</span>
						</>
					)}
				</div>
			);
		},
	},
	{
		id: "category",
		header: "Category",
		accessorFn: (client) => client.category?.name ?? "",
		cell: ({ row }) => (
			<Badge variant="outline" className="text-primary border-primary/40 bg-primary/5 rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase">
				{row.original.category?.name || "None"}
			</Badge>
		),
	},
	{
		id: "membership",
		header: "Membership",
		accessorFn: (client) => client.wallets?.[0]?.remainingCredits ?? -1,
		cell: ({ row }) => <MembershipBadge client={row.original} />,
	},
	{
		id: "health",
		header: () => <div className="text-center">Health</div>,
		accessorFn: (client) => alertsOf(client).length,
		cell: ({ row }) => {
			const alerts = alertsOf(row.original);
			return alerts.length ? (
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="bg-destructive/10 text-destructive mx-auto flex h-8 w-8 cursor-help items-center justify-center rounded-xl transition-all hover:scale-110">
							<Danger size={18} variant="Bulk" />
						</div>
					</TooltipTrigger>
					<TooltipContent side="top" align="center" className="max-w-xs rounded-xl border bg-red-50 p-3 shadow-xl">
						<div className="flex flex-col gap-2">
							<p className="text-destructive border-destructive/10 flex items-center gap-1.5 border-b pb-1.5 text-[10px] font-black tracking-widest uppercase">
								<Danger size={12} variant="Bulk" />
								Health Alerts
							</p>
							<ul className="space-y-1">
								{alerts.map((a) => (
									<li key={a.id} className="text-foreground flex items-center gap-2 text-[11px] font-medium">
										<span className="bg-destructive h-1.5 w-1.5 rounded-full" />
										{a.condition}
									</li>
								))}
							</ul>
						</div>
					</TooltipContent>
				</Tooltip>
			) : (
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="mx-auto flex h-8 w-8 cursor-help items-center justify-center rounded-xl bg-green-100 text-green-500 transition-all hover:scale-110">
							<TickCircle size={18} variant="Bulk" />
						</div>
					</TooltipTrigger>
					<TooltipContent className="rounded-lg border-0 bg-green-50 px-2 py-1 text-[11px] font-bold text-green-700">
						No health alerts recorded
					</TooltipContent>
				</Tooltip>
			);
		},
	},
	{
		id: "phone",
		header: "Phone",
		enableSorting: false,
		cell: ({ row }) => {
			const phone = row.original.phone;
			return (
				<div className="flex min-w-[140px] items-center gap-2">
					<Phone size={14} variant="Bold" className="text-primary" />
					<Link
						href={whatsappHref(phone)}
						target="_blank"
						aria-label={`WhatsApp ${row.original.fullName}`}
						className="flex size-6 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366] transition-all hover:scale-105 hover:bg-[#25D366] hover:text-white"
					>
						<Whatsapp className="size-4" variant="Bold" />
					</Link>
					<Link href={`tel:${phone}`} className="hover:text-primary text-foreground text-xs font-medium tracking-tight transition-colors">
						{phone}
					</Link>
				</div>
			);
		},
	},
	{
		id: "email",
		header: "Email",
		enableSorting: false,
		cell: ({ row }) =>
			row.original.email ? (
				<div className="flex min-w-[180px] items-center gap-2">
					<Mail size={14} variant="Bold" className="text-secondary-2" />
					<Link
						href={`mailto:${row.original.email}`}
						className="hover:text-secondary-3 text-foreground truncate text-xs font-medium transition-colors"
						title={row.original.email}
					>
						{row.original.email}
					</Link>
				</div>
			) : (
				<span className="text-muted-foreground/50 text-[10px] font-bold tracking-widest uppercase italic">No Email</span>
			),
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
		<TooltipProvider>
			<DataTable
				data={clients}
				columns={columns}
				noun={{ one: "client", many: "clients" }}
				getRowHref={(client) => `/clients/${client.id}`}
				empty={
					<EmptyState
						icon={<People size={40} variant="Bulk" />}
						title="No clients found"
						description="Adjust your filters, or add a new client."
					/>
				}
				renderCard={(client) => {
					const alerts = alertsOf(client);
					return (
						<div className="flex flex-col gap-3">
							<div className="flex items-start justify-between gap-2">
								<Link href={`/clients/${client.id}`} className="flex min-w-0 items-center gap-3">
									<div className="relative shrink-0">
										<ClientAvatar client={client} />
										{client.activeSessionName ? (
											<span className="absolute -right-0.5 -bottom-0.5 block h-3 w-3 rounded-full border-2 border-white bg-green-500" />
										) : null}
									</div>
									<div className="min-w-0">
										<p className="text-foreground truncate text-sm font-bold">{client.fullName}</p>
										<p className="text-muted-foreground truncate text-xs">{client.category?.name || "No category"}</p>
									</div>
								</Link>
								<ClientActions client={client} />
							</div>
							{/* On a phone there is no hover: alerts are written out, not hidden in a tooltip. */}
							{alerts.length ? (
								<div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-xl px-3 py-2 text-xs font-semibold">
									<Danger size={16} variant="Bulk" className="mt-px shrink-0" />
									<span>{alerts.map((a) => a.condition).join(" · ")}</span>
								</div>
							) : null}
							<div className="border-secondary/15 flex items-center justify-between gap-2 border-t pt-3">
								<MembershipBadge client={client} />
								<div className="flex items-center gap-2">
									<Link
										href={whatsappHref(client.phone)}
										target="_blank"
										aria-label={`WhatsApp ${client.fullName}`}
										className="flex size-10 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366]"
									>
										<Whatsapp size={20} variant="Bold" />
									</Link>
									<Link
										href={`tel:${client.phone}`}
										aria-label={`Call ${client.fullName}`}
										className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl"
									>
										<Phone size={20} variant="Bold" />
									</Link>
								</div>
							</div>
						</div>
					);
				}}
			/>
		</TooltipProvider>
	);
}
