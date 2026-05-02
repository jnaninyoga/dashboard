"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { getGoogleContactPhotoAction } from "@/lib/actions/clients/mutations";
import { type ClientWithRelations as Client } from "@/lib/types";
import { cn } from "@/lib/utils/ui";

import { Call, Danger, Sms, TickCircle, User, Whatsapp } from "iconsax-reactjs";

import { ClientActions } from "./actions";

// Helper to check if client is online (checked in today)
function isClientOnline(client: Client) {
	return !!client.activeSessionName;
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
		<div className="flex flex-col items-end gap-1">
			<div className="flex items-center gap-1">
				<span
					className={cn(
						"mr-1 text-[10px] font-medium",
						percentage <= 20 ? "text-destructive" : "text-muted-foreground",
					)}
				>
					{remaining} / {total}
				</span>

				{/* Battery Body */}
				<div className="border-muted-foreground/30 relative flex h-2.5 w-6 items-center rounded-sm border p-[0.5px]">
					<div
						className={cn("h-full rounded-[0.5px] transition-all", colorClass)}
						style={{ width: `${percentage}%` }}
					/>
				</div>
				{/* Battery Tip */}
				<div className="bg-muted-foreground/30 -ml-0.5 h-1 w-0.5 rounded-r-[0.5px]"></div>
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
	const [photoUrl, setPhotoUrl] = useState<string | null>(
		client.photoUrl || null,
	);

	useEffect(() => {
		// Skip API call if we already have a cached photo URL
		if (photoUrl) return;

		if (client.googleContactResourceName) {
			getGoogleContactPhotoAction(
				client.googleContactResourceName,
				client.id,
			).then((res) => {
				if (res.success && res.url) {
					setPhotoUrl(res.url);
				}
			});
		}
	}, [client.googleContactResourceName, client.id, photoUrl]);

	return (
		<Avatar
			className={cn(
				"border-background h-20 w-20 border-2 shadow-md",
				className,
			)}
		>
			<AvatarImage src={photoUrl || undefined} alt={client.fullName} />
			<AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
				{client.fullName.charAt(0)}
			</AvatarFallback>
		</Avatar>
	);
}

export function ClientsGrid({ clients }: { clients: Client[] }) {
	if (clients.length === 0) {
		return (
			<div className="animate-slide-up flex h-64 items-center justify-center rounded-md border border-dashed delay-150">
				<p className="text-muted-foreground">No clients found.</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
			{clients.map((client, index) => {
				const activeWallet = client.wallets?.[0];

				// Filter for actual alerts
				const alerts = client.healthLogs?.filter((l) => l.isAlert) || [];
				const isOnline = isClientOnline(client);

				return (
					<Card
						key={client.id}
						className={cn(
							"group animate-slide-up border-muted/60 hover:zen-shadow-md relative flex flex-col overflow-hidden rounded-3xl transition-all duration-300 ease-out",
							isOnline && "border-green-500/50 ring-1 ring-green-500/50",
						)}
						style={{
							animationDelay: `${index * 50}ms`,
							animationFillMode: "both",
						}}
					>
						{/* Top Status Bar & Actions */}
						<div className="absolute top-3 right-3 z-10 flex items-center gap-2">
							{isOnline ? (
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex cursor-help items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-green-600 shadow-sm backdrop-blur-sm">
												<span className="relative flex h-2 w-2">
													<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
													<span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
												</span>
												<span className="max-w-[120px] truncate text-[10px] font-bold tracking-wider uppercase">
													{client.activeSessionName || "Live"}
												</span>
											</div>
										</TooltipTrigger>
										<TooltipContent side="left">
											<p className="text-xs font-semibold text-green-600">
												Checked in to {client.activeSessionName || "a session"}{" "}
												today
											</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							) : null}
							<ClientActions client={client} />
						</div>

						<CardContent className="flex flex-1 flex-col gap-4 p-4">
							{/* Horizontal Identity Section */}
							<div className="flex items-start gap-3 pr-8">
								<Link
									href={`/clients/${client.id}`}
									className="group/avatar shrink-0"
								>
									<ClientAvatar
										client={client}
										className="border-background h-12 w-12 border-2 shadow-sm"
									/>
								</Link>

								<div className="flex min-w-0 flex-col pt-0.5">
									<Link href={`/clients/${client.id}`} className="group/name">
										<h3 className="group-hover/name:text-primary truncate text-base leading-tight font-bold transition-colors">
											{client.fullName}
										</h3>
									</Link>
									<p className="text-muted-foreground mt-0.5 flex h-4 items-center gap-1.5 truncate text-xs">
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

							<div className="border-border/40 w-full border-t"></div>

							{/* Gender Section — above membership */}
							<div className="flex items-center gap-3 text-xs">
								<span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
									Gender
								</span>
								<TooltipProvider delayDuration={150}>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex cursor-default items-center gap-1.5 font-medium">
												{client.gender === "male" ? (
													<>
														<User
															className="size-3.5 text-blue-500"
															variant="Bulk"
														/>
														<span className="text-foreground capitalize">
															Male
														</span>
													</>
												) : client.gender === "female" ? (
													<>
														<User
															className="size-3.5 text-pink-500"
															variant="Bulk"
														/>
														<span className="text-foreground capitalize">
															Female
														</span>
													</>
												) : (
													<>
														<User
															className="size-3.5 text-gray-400"
															variant="Outline"
														/>
														<span className="text-foreground capitalize">
															Unspecified
														</span>
													</>
												)}
											</div>
										</TooltipTrigger>
										<TooltipContent
											sideOffset={6}
											className="zen-shadow-sm rounded-lg border-0 px-2 py-1 text-[11px] font-bold capitalize"
										>
											{client.gender || "Not specified"}
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>

							{/* Compact Membership Block */}
							<div className="grid grid-cols-2 items-center gap-x-4 gap-y-1 text-xs">
								<div className="flex flex-col gap-0.5">
									<span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
										Membership
									</span>
									<span
										className="truncate font-medium"
										title={activeWallet?.product?.name || "None"}
									>
										{activeWallet?.product?.name || "None"}
									</span>
								</div>

								<div className="flex flex-col items-end gap-0.5">
									<span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
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
								<span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
									Category Discount
								</span>
								<div className="flex flex-wrap gap-1.5">
									{client.category ? (
										<Badge
											variant="secondary"
											className="bg-primary/10 text-primary rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold tracking-wide"
										>
											{client.category.name}
											{client.category.discountValue &&
											client.category.discountValue !== "0" &&
											client.category.discountType === "percentage"
												? ` (${client.category.discountValue}%)`
												: client.category.discountValue &&
													  client.category.discountValue !== "0"
													? ` (${client.category.discountValue} MAD)`
													: ""}
										</Badge>
									) : (
										<Badge
											variant="outline"
											className="rounded-full border-dashed px-2 py-0.5 text-[10px] font-semibold tracking-wide opacity-60"
										>
											Uncategorized
										</Badge>
									)}
								</div>
							</div>

							{/* Compact Footer — Split with Vertical Separator */}
							<div className="text-secondary-3 bg-secondary/40 border-secondary-2/40 mt-auto flex items-stretch overflow-hidden rounded-md border py-2 text-xs">
								<TooltipProvider delayDuration={150}>
									{/* Left Section: Social Icons */}
									<div className="border-secondary-2/60 flex flex-1 items-center gap-4 border-r px-3 sm:justify-start">
										<Tooltip>
											<TooltipTrigger asChild>
												<Link
													href={client.email ? `mailto:${client.email}` : "#"}
													tabIndex={client.email ? 0 : -1}
													onClick={(e) => !client.email && e.preventDefault()}
													aria-disabled={!client.email}
													className="bg-secondary-2/40 hover:text-primary hover:bg-primary/15 aria-disabled:text-muted-foreground aria-disabled:bg-muted aria-disabled:hover:text-muted-foreground/60 flex items-center justify-center rounded-full p-2 transition-colors hover:scale-110 active:scale-95"
												>
													<Sms className="h-4 w-4" variant="Bulk" />
												</Link>
											</TooltipTrigger>
											<TooltipContent
												sideOffset={6}
												className="zen-shadow-sm z-50 rounded-lg border-0 px-2 py-1 text-[11px] font-bold"
											>
												{client.email || "No Email"}
											</TooltipContent>
										</Tooltip>

										<Tooltip>
											<TooltipTrigger asChild>
												<Link
													href={`https://wa.me/${client.phone}`}
													target="_blank"
													className="bg-secondary-2/40 flex items-center justify-center rounded-full p-2 transition-colors hover:scale-110 hover:bg-[#25D366]/15 hover:text-[#25D366] active:scale-95"
												>
													<Whatsapp className="h-4 w-4" variant="Bulk" />
												</Link>
											</TooltipTrigger>
											<TooltipContent
												sideOffset={6}
												className="zen-shadow-sm z-50 rounded-lg border-0 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700"
											>
												WhatsApp: {client.phone}
											</TooltipContent>
										</Tooltip>

										<Tooltip>
											<TooltipTrigger asChild>
												<Link
													href={`tel:${client.phone}`}
													className="bg-secondary-2/40 hover:text-primary hover:bg-primary/15 flex items-center justify-center rounded-full p-2 transition-colors hover:scale-110 active:scale-95"
												>
													<Call className="h-4 w-4" variant="Bulk" />
												</Link>
											</TooltipTrigger>
											<TooltipContent
												sideOffset={6}
												className="zen-shadow-sm z-50 rounded-lg border-0 px-2 py-1 text-[11px] font-bold"
											>
												Call: {client.phone}
											</TooltipContent>
										</Tooltip>
									</div>

									{/* Right Section: Health Status Indicator */}
									<div className="flex min-w-[35%] shrink-0 items-center justify-center px-4">
										{alerts.length > 0 ? (
											<Tooltip>
												<TooltipTrigger asChild>
													<div className="text-destructive group/health relative flex animate-pulse cursor-help items-center rounded-full bg-red-200 p-2 font-bold hover:animate-none hover:bg-red-600 hover:text-white">
														<Danger className="size-4" variant="Bulk" />
														<span
															aria-hidden={alerts.length <= 1}
															className="absolute top-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold tracking-tighter text-white transition-all duration-200 group-hover/health:border group-hover/health:border-red-600 group-hover/health:bg-white group-hover/health:text-red-600"
														>
															{alerts.length}
														</span>
													</div>
												</TooltipTrigger>
												<TooltipContent
													sideOffset={6}
													className="zen-shadow-lg z-50 max-w-xs rounded-xl border-0 bg-red-50 p-3 text-[11px] text-red-900"
												>
													<div className="flex flex-col gap-2">
														<div className="flex items-center gap-1.5 border-b border-red-200 pb-1 font-bold text-red-700">
															<Danger className="size-3.5" variant="Bulk" />
															Active Health Alerts
														</div>
														{alerts.map((log, idx) => (
															<div key={idx} className="flex flex-col gap-0.5">
																<div className="flex items-center gap-1.5">
																	<span
																		className={cn(
																			"size-1.5 shrink-0 rounded-full",
																			log.severity === "critical"
																				? "bg-red-600"
																				: "bg-orange-400",
																		)}
																	/>
																	<span className="font-bold">
																		{log.condition}
																	</span>
																</div>
															</div>
														))}
													</div>
												</TooltipContent>
											</Tooltip>
										) : (
											<Tooltip>
												<TooltipTrigger asChild>
													<div className="flex cursor-help items-center gap-2 rounded-full bg-green-200 p-2 font-bold text-green-600 opacity-80 transition-opacity hover:opacity-100">
														<TickCircle className="size-4" variant="Bulk" />
													</div>
												</TooltipTrigger>
												<TooltipContent
													sideOffset={6}
													className="zen-shadow-sm z-50 rounded-lg border-0 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700"
												>
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
