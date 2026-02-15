"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientActions } from "./client-actions";
import { getGoogleContactPhotoAction } from "@/actions/clients";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Phone, Briefcase } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Types
interface Client {
	id: string;
	fullName: string;
	email?: string | null;
	phone: string;
	category: string;
	gender?: string | null;
	profession?: string | null;
	address?: string | null;
	birthDate?: string | null;
	googleContactResourceName?: string | null;
	createdAt: Date;
	wallets?: {
		remainingCredits: number;
		product: {
			name: string;
			defaultCredits: number;
		} | null;
		ledgerEntries?: {
			checkInTime: Date;
		}[];
	}[];
	healthLogs?: {
		condition: string;
		isAlert: boolean;
	}[];
}

// Helper to check if client is online (checked in today)
function isClientOnline(client: Client) {
	const lastCheckIn = client.wallets?.[0]?.ledgerEntries?.[0]?.checkInTime;
	if (!lastCheckIn) return false;

	const checkInDate = new Date(lastCheckIn);
	const today = new Date();
	return (
		checkInDate.getDate() === today.getDate() &&
		checkInDate.getMonth() === today.getMonth() &&
		checkInDate.getFullYear() === today.getFullYear()
	);
}

function CreditBattery({
	remaining,
	total,
}: {
	remaining: number;
	total: number;
}) {
	const percentage = Math.max(0, Math.min(100, (remaining / total) * 100));

	let colorClass = "bg-primary"; // Default Green-ish (primary)
	if (percentage <= 20)
		colorClass = "bg-destructive"; // Red
	else if (percentage <= 50)
		colorClass = "bg-yellow-500"; // Yellow/Orange
	else colorClass = "bg-green-500"; // Green

	return (
		<div className="flex flex-col gap-1 items-end">
			<div className="flex items-center gap-1">
				<span
					className={cn(
						"text-[10px] font-medium mr-1",
						percentage <= 20 ? "text-destructive" : "text-muted-foreground",
					)}
				>
					{remaining} / {total}
				</span>

				{/* Battery Body */}
				<div className="relative h-2.5 w-6 rounded-sm border border-muted-foreground/30 p-[0.5px] flex items-center">
					<div
						className={cn("h-full rounded-[0.5px] transition-all", colorClass)}
						style={{ width: `${percentage}%` }}
					/>
				</div>
				{/* Battery Tip */}
				<div className="h-1 w-0.5 rounded-r-[0.5px] bg-muted-foreground/30 -ml-0.5"></div>
			</div>
		</div>
	);
}

function ClientAvatar({
	client,
	className,
}: {
	client: Client;
	className?: string;
}) {
	const [photoUrl, setPhotoUrl] = useState<string | null>(null);

	useEffect(() => {
		if (client.googleContactResourceName) {
			getGoogleContactPhotoAction(client.googleContactResourceName).then(
				(res) => {
					if (res.success && res.url) {
						setPhotoUrl(res.url);
					}
				},
			);
		}
	}, [client.googleContactResourceName]);

	return (
		<Avatar
			className={cn(
				"h-20 w-20 border-2 border-background shadow-md",
				className,
			)}
		>
			<AvatarImage src={photoUrl || undefined} alt={client.fullName} />
			<AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold">
				{client.fullName.charAt(0)}
			</AvatarFallback>
		</Avatar>
	);
}

export function ClientsGrid({ clients }: { clients: any[] }) {
	if (clients.length === 0) {
		return (
			<div className="flex h-64 items-center justify-center rounded-md border border-dashed">
				<p className="text-muted-foreground">No clients found.</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{clients.map((client) => {
				const activeWallet = client.wallets?.[0];

				// Filter for actual alerts
				const alerts = client.healthLogs?.filter((l: any) => l.isAlert) || [];
				const hasAlerts = alerts.length > 0;
				const isOnline = isClientOnline(client);

				return (
					<Card
						key={client.id}
						className={cn(
							"group relative flex flex-col overflow-hidden transition-all hover:shadow-md border-muted/60",
							isOnline && "ring-1 ring-green-500/50 border-green-500/50",
						)}
					>
						{/* Top Status Bar & Actions */}
						<div className="absolute top-3 right-3 z-10 flex gap-2 items-center">
							{isOnline && (
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex h-2.5 w-2.5 relative cursor-help">
												<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
												<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 border border-white"></span>
											</div>
										</TooltipTrigger>
										<TooltipContent side="left">
											<p className="font-semibold text-xs text-green-600">
												Checked in today
											</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							)}
							<ClientActions client={client} />
						</div>

						<CardContent className="p-4 space-y-4">
							{/* Horizontal Identity Section */}
							<div className="flex items-start gap-3 pr-8">
								<Link
									href={`/clients/${client.id}`}
									className="shrink-0 group/avatar"
								>
									<ClientAvatar
										client={client}
										className="h-12 w-12 border-2 border-background shadow-sm"
									/>
								</Link>

								<div className="flex flex-col min-w-0 pt-0.5">
									<Link href={`/clients/${client.id}`} className="group/name">
										<h3 className="font-bold text-base leading-tight truncate group-hover/name:text-primary transition-colors">
											{client.fullName}
										</h3>
									</Link>
									<p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate h-4">
										{client.profession ? (
											<span className="truncate">{client.profession}</span>
										) : (
											<span className="capitalize">{client.category}</span>
										)}
									</p>

									{/* Health Alerts Inline */}
									{hasAlerts && (
										<div className="flex items-center gap-1 text-destructive text-[10px] font-bold uppercase tracking-wider mt-1.5">
											<AlertCircle className="h-3 w-3" />
											<span>
												{alerts.length} Alert{alerts.length > 1 ? "s" : ""}
											</span>
										</div>
									)}
								</div>
							</div>

							<div className="w-full border-t border-border/40"></div>

							{/* Compact Membership Block */}
							<div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs items-center">
								<div className="flex flex-col gap-0.5">
									<span className="text-muted-foreground font-medium text-[10px] uppercase tracking-wide">
										Membership
									</span>
									<span
										className="font-medium truncate"
										title={activeWallet?.product?.name || "None"}
									>
										{activeWallet?.product?.name || "None"}
									</span>
								</div>

								<div className="flex flex-col gap-0.5 items-end">
									<span className="text-muted-foreground font-medium text-[10px] uppercase tracking-wide">
										Credits
									</span>
									{activeWallet?.product ? (
										<CreditBattery
											remaining={activeWallet.remainingCredits}
											total={activeWallet.product.defaultCredits}
										/>
									) : (
										<span className="text-muted-foreground">-</span>
									)}
								</div>
							</div>

							{/* Compact Footer */}
							<div className="flex items-center justify-between text-xs text-muted-foreground bg-secondary/30 rounded-md py-1.5 px-2.5 -mx-1">
								<div className="flex items-center gap-1.5 truncate max-w-[60%]">
									<Phone className="h-3 w-3 shrink-0 opacity-70" />
									<span className="truncate">{client.phone}</span>
								</div>

								<div className="flex items-center gap-1.5 shrink-0">
									<span
										className={cn(
											"h-1.5 w-1.5 rounded-full",
											client.gender === "male"
												? "bg-blue-400"
												: client.gender === "female"
													? "bg-pink-400"
													: "bg-gray-400",
										)}
									/>
									<span className="capitalize">{client.category}</span>
								</div>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
