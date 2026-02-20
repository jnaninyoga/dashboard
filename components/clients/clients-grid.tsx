"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientActions } from "./client-actions";
import { getGoogleContactPhotoAction } from "@/actions/clients";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Phone, Briefcase, Mail } from "lucide-react";
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
	category: { name: string } | null;
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
											<span className="capitalize">{client.category?.name || "Uncategorized"}</span>
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
								<div className="flex items-center gap-2 truncate max-w-[60%]">
									{client.email && <Link href={`mailto:${client.email}`} className="flex items-center gap-1.5">
										<Mail className="h-3 w-3 shrink-0 opacity-70" />
										<span>{client.email}</span>
									</Link>}
									
									<Link href={`https://wa.me/${client.phone}`} target="_blank" className="flex items-center">
										{/* WhatsApp SVG Icon */}
										<svg 
											xmlns="http://www.w3.org/2000/svg"
											width="16"
											height="16"
											fill="currentColor"
											viewBox="0 0 16 16"
											className="h-3 w-3 shrink-0 opacity-70"
											>
											<path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
										</svg>
									</Link>

									<Link href={`tel:${client.phone}`} className="flex items-center gap-1.5">
										<Phone className="h-3 w-3 shrink-0 opacity-70" />
										<span>{client.phone}</span>
									</Link>
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
									<span className="capitalize">{client.category?.name || "Uncategorized"}</span>
								</div>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
