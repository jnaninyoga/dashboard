"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientActions } from "./client-actions";
import { getGoogleContactPhotoAction } from "@/actions/clients";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Danger, Call, Sms, User, TickCircle, Whatsapp } from "iconsax-reactjs";
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
	category: { name: string; discountType?: "percentage" | "fixed" | null; discountValue?: string | null } | null;
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
		severity?: string;
	}[];
}

// Helper to check if client is online (checked in today)
function isClientOnline(client: Client) {
	return !!(client as Record<string, any>).activeSessionName;
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

export function ClientsGrid({ clients }: { clients: Client[] }) {
	if (clients.length === 0) {
		return (
			<div className="flex h-64 items-center justify-center rounded-md border border-dashed">
				<p className="text-muted-foreground">No clients found.</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
			{clients.map((client) => {
				const activeWallet = client.wallets?.[0];

				// Filter for actual alerts
				const alerts = client.healthLogs?.filter((l) => l.isAlert) || [];
				const isOnline = isClientOnline(client);

				return (
					<Card
						key={client.id}
						className={cn(
							"group relative flex flex-col overflow-hidden transition-all duration-300 ease-out rounded-3xl border-muted/60 hover:zen-shadow-md",
							isOnline && "ring-1 ring-green-500/50 border-green-500/50",
						)}
					>
						{/* Top Status Bar & Actions */}
						<div className="absolute top-3 right-3 z-10 flex gap-2 items-center">
							{isOnline && (
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex items-center gap-1.5 bg-green-500/10 backdrop-blur-sm border border-green-500/20 px-2.5 py-1 rounded-full text-green-600 shadow-sm cursor-help">
												<span className="relative flex h-2 w-2">
													<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
													<span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
												</span>
												<span className="text-[10px] font-bold uppercase tracking-wider truncate max-w-[120px]">
													{(client as any).activeSessionName || "Live"}
												</span>
											</div>
										</TooltipTrigger>
										<TooltipContent side="left">
											<p className="font-semibold text-xs text-green-600">
												Checked in to {(client as any).activeSessionName || "a session"} today
											</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							)}
							<ClientActions client={client} />
						</div>

						<CardContent className="p-4 flex flex-col flex-1 gap-4">
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
											<span className="capitalize">
												{client.category?.name || "Uncategorized"}
											</span>
										)}
									</p>
								</div>
							</div>

							<div className="w-full border-t border-border/40"></div>

							{/* Gender Section — above membership */}
							<div className="flex items-center gap-3 text-xs">
								<span className="text-muted-foreground font-medium text-[10px] uppercase tracking-wide">
									Gender
								</span>
								<TooltipProvider delayDuration={150}>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex items-center gap-1.5 font-medium cursor-default">
												{client.gender === "male" ? (
													<>
														<User className="size-3.5 text-blue-500" variant="Bulk" />
														<span className="capitalize text-foreground">Male</span>
													</>
												) : client.gender === "female" ? (
													<>
														<User className="size-3.5 text-pink-500" variant="Bulk" />
														<span className="capitalize text-foreground">Female</span>
													</>
												) : (
													<>
														<User className="size-3.5 text-gray-400" variant="Outline" />
														<span className="capitalize text-foreground">Unspecified</span>
													</>
												)}
											</div>
										</TooltipTrigger>
										<TooltipContent sideOffset={6} className="text-[11px] font-bold px-2 py-1 border-0 zen-shadow-sm rounded-lg capitalize">
											{client.gender || "Not specified"}
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>

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

							{/* Category Discount Section */}
							<div className="flex flex-col gap-1.5">
								<span className="text-muted-foreground font-medium text-[10px] uppercase tracking-wide">
									Category Discount
								</span>
								<div className="flex flex-wrap gap-1.5">
									{client.category ? (
										<Badge variant="secondary" className="font-semibold text-[10px] tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary border-0">
											{client.category.name}
											{client.category.discountValue && client.category.discountValue !== "0" && client.category.discountType === "percentage" 
												? ` (${client.category.discountValue}%)` 
												: client.category.discountValue && client.category.discountValue !== "0" 
													? ` (${client.category.discountValue} MAD)` 
													: ""}
										</Badge>
									) : (
										<Badge variant="outline" className="font-semibold text-[10px] tracking-wide px-2 py-0.5 rounded-full border-dashed opacity-60">
											Uncategorized
										</Badge>
									)}
								</div>
							</div>

							{/* Compact Footer — Split with Vertical Separator */}
							<div className="mt-auto flex items-stretch text-xs text-muted-foreground bg-secondary/30 rounded-md py-2 overflow-hidden">
								<TooltipProvider delayDuration={150}>
									{/* Left Section: Social Icons */}
									<div className="flex items-center gap-4 px-3 flex-1 border-r border-foreground/10 justify-center sm:justify-start">
										<Tooltip>
											<TooltipTrigger asChild>
												{client.email ? (
															<Link
																href={`mailto:${client.email}`}
																className="hover:text-primary transition-colors hover:scale-110 active:scale-95 flex items-center justify-center p-1"
															>
																<Sms className="h-4 w-4 opacity-90" variant="Outline" />
															</Link>
												) : (
													<div
														className="flex items-center justify-center p-1 text-muted-foreground/50"
													>
														<Sms className="h-4 w-4" variant="Outline" />
													</div>
												)}
											</TooltipTrigger>
											<TooltipContent sideOffset={6} className="text-[11px] font-bold px-2 py-1 border-0 zen-shadow-sm rounded-lg z-50">
												{client.email || "No Email"}
											</TooltipContent>
										</Tooltip>

										<Tooltip>
											<TooltipTrigger asChild>
												<Link
													href={`https://wa.me/${client.phone}`}
													target="_blank"
													className="hover:text-[#25D366] transition-colors hover:scale-110 active:scale-95 flex items-center justify-center p-1"
												>
													<Whatsapp className="h-4 w-4" variant="Outline" />
												</Link>
											</TooltipTrigger>
											<TooltipContent sideOffset={6} className="text-[11px] font-bold px-2 py-1 border-0 zen-shadow-sm rounded-lg bg-emerald-50 text-emerald-700 z-50">
												WhatsApp: {client.phone}
											</TooltipContent>
										</Tooltip>

										<Tooltip>
											<TooltipTrigger asChild>
												<Link
													href={`tel:${client.phone}`}
													className="hover:text-primary transition-colors hover:scale-110 active:scale-95 flex items-center justify-center p-1"
												>
													<Call className="h-4 w-4 opacity-90" variant="Outline" />
												</Link>
											</TooltipTrigger>
											<TooltipContent sideOffset={6} className="text-[11px] font-bold px-2 py-1 border-0 zen-shadow-sm rounded-lg z-50">
												Call: {client.phone}
											</TooltipContent>
										</Tooltip>
									</div>

									{/* Right Section: Health Status Indicator */}
									<div className="flex items-center justify-center px-4 shrink-0 min-w-[35%]">
										{alerts.length > 0 ? (
											<Tooltip>
												<TooltipTrigger asChild>
													<div className="flex items-center gap-2 text-destructive font-bold cursor-help group/health animate-pulse p-1">
														<Danger className="size-4" variant="Bulk" />
														<span className="text-[10px] uppercase tracking-tighter hidden xs:inline">Alerts ({alerts.length})</span>
													</div>
												</TooltipTrigger>
												<TooltipContent sideOffset={6} className="text-[11px] border-0 zen-shadow-lg rounded-xl p-3 bg-red-50 text-red-900 z-50 max-w-xs">
													<div className="flex flex-col gap-2">
														<div className="font-bold flex items-center gap-1.5 text-red-700 pb-1 border-b border-red-200">
															<Danger className="size-3.5" variant="Bulk" />
															Active Health Alerts
														</div>
														{alerts.map((log: any, idx: number) => (
															<div key={idx} className="flex flex-col gap-0.5">
																<div className="flex items-center gap-1.5">
																	<span className={cn(
																		"size-1.5 rounded-full shrink-0",
																		log.severity === "critical" ? "bg-red-600" : "bg-orange-400"
																	)} />
																	<span className="font-bold">{log.condition}</span>
																</div>
															</div>
														))}
													</div>
												</TooltipContent>
											</Tooltip>
										) : (
											<Tooltip>
												<TooltipTrigger asChild>
													<div className="flex items-center gap-2 text-primary font-bold cursor-help p-1 opacity-80 hover:opacity-100 transition-opacity">
														<TickCircle className="size-4" variant="Outline" />
														<span className="text-[10px] uppercase tracking-tighter hidden xs:inline">Safe</span>
													</div>
												</TooltipTrigger>
												<TooltipContent sideOffset={6} className="text-[11px] font-bold px-2 py-1 border-0 zen-shadow-sm rounded-lg bg-emerald-50 text-emerald-700 z-50">
													No health alerts recorded
												</TooltipContent>
											</Tooltip>
										)}
									</div>
								</TooltipProvider>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
