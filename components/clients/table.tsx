"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getGoogleContactPhotoAction } from "@/actions/clients/mutations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
    type Client, 
    type ClientCategory, 
    type ClientWallet, 
    type HealthLog, 
    type MembershipProduct 
} from "@/drizzle/schema";

import { 
    Call as Phone, 
    Card, 
    Danger, 
    Sms as Mail, 
    TickCircle, 
    User, 
	Whatsapp
} from "iconsax-reactjs";

import { ClientActions } from "./actions";

type ClientWithRelations = Client & {
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

export function ClientsTable({ clients }: { clients: ClientWithRelations[] }) {
	return (
		<div className="animate-slide-up transition-all delay-150">
			<Table containerClassName="overflow-x-auto">
				<TableHeader>
					<TableRow className="border-b transition-colors hover:bg-transparent">
						<TableHead className="px-6">Client</TableHead>
						<TableHead>Gender</TableHead>
						<TableHead>Category</TableHead>
						<TableHead>Membership</TableHead>
						<TableHead className="text-center">Health</TableHead>
						<TableHead>Phone</TableHead>
						<TableHead>Email</TableHead>
						<TableHead className="pr-6 text-right"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody className="divide-secondary/15 divide-y">
					{clients.length === 0 ? (
						<TableRow>
							<TableCell colSpan={8} className="h-32 text-center">
								<div className="flex flex-col items-center justify-center gap-1 opacity-40">
									<p className="text-sm font-bold tracking-widest uppercase">No clients found</p>
									<p className="text-xs">Adjust your filters or add a new client</p>
								</div>
							</TableCell>
						</TableRow>
					) : (
						clients.map((client) => {
							const activeWallet = client.wallets?.[0];
							const alerts =
								client.healthLogs?.filter((l) => l.isAlert) || [];
							const hasAlerts = alerts.length > 0;

							return (
								<TableRow 
									key={client.id}
									className="hover:bg-primary/5 group border-none transition-colors"
								>
									{/* Avatar + Name Cell */}
									<TableCell className="px-6 py-4">
										<div className="flex items-center gap-4">
											<Link
												href={`/clients/${client.id}`}
												className="group/avatar relative shrink-0"
											>
												<ClientAvatar client={client} />
												{client.activeSessionName ? (
													<span className="absolute -right-0.5 -bottom-0.5 block h-3 w-3 rounded-full border-2 border-white bg-green-500 shadow-sm" />
												) : null}
											</Link>
											<div className="flex min-w-0 flex-col">
												<div className="flex items-center gap-2">
													<Link
														href={`/clients/${client.id}`}
														className="text-foreground group-hover:text-primary truncate text-sm font-bold tracking-tight transition-colors"
													>
														{client.fullName}
													</Link>
													{client.activeSessionName ? (
														<TooltipProvider>
															<Tooltip>
																<TooltipTrigger asChild>
																	<div className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-green-700 shadow-sm">
																		<span className="relative flex h-1 w-1">
																			<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
																			<span className="relative inline-flex h-1 w-1 rounded-full bg-green-500"></span>
																		</span>
																		<span className="max-w-[80px] truncate text-[8px] font-black tracking-widest uppercase">
																			{client.activeSessionName}
																		</span>
																	</div>
																</TooltipTrigger>
																<TooltipContent>
																	<p className="text-xs font-semibold text-green-600">
																		Present in the club today
																	</p>
																</TooltipContent>
															</Tooltip>
														</TooltipProvider>
													) : null}
												</div>
											</div>
										</div>
									</TableCell>

									{/* Gender Cell */}
									<TableCell className="py-4">
										<div className="flex items-center gap-2 font-medium">
											{client.gender === "male" ? (
												<>
													<User className="size-4 text-blue-500" variant="Bulk" />
													<span className="text-foreground text-xs capitalize">Male</span>
												</>
											) : client.gender === "female" ? (
												<>
													<User className="size-4 text-pink-500" variant="Bulk" />
													<span className="text-foreground text-xs capitalize">Female</span>
												</>
											) : (
												<>
													<User className="text-muted-foreground/40 size-4" variant="Outline" />
													<span className="text-muted-foreground/60 text-xs">Unspecified</span>
												</>
											)}
										</div>
									</TableCell>

									{/* Category Cell */}
									<TableCell className="py-4">
										<Badge variant="outline" className="text-primary border-primary/40 bg-primary/5 rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase">
											{client.category?.name || "None"}
										</Badge>
									</TableCell>

									{/* Membership Cell */}
									<TableCell className="py-4">
										{activeWallet ? (
											<Badge className="bg-primary/90 hover:bg-primary gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase shadow-sm">
												<Card size={10} variant="Bold" className="text-white opacity-80" />
												{activeWallet.remainingCredits} / {activeWallet.product?.defaultCredits || 0}
											</Badge>
										) : (
											<span className="text-muted-foreground/30 text-[10px] font-bold tracking-widest uppercase italic">No Pack</span>
										)}
									</TableCell>

									{/* Health Cell */}
									<TableCell className="py-4 text-center">
										{hasAlerts ? (
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<div className="bg-destructive/10 text-destructive mx-auto flex h-8 w-8 cursor-help items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-90">
															<Danger size={18} variant="Bulk" />
														</div>
													</TooltipTrigger>
													<TooltipContent side="top" align="center" className="border max-w-xs rounded-xl bg-red-50 p-3 shadow-xl">
														<div className="flex flex-col gap-2">
															<p className="text-destructive border-destructive/10 flex items-center gap-1.5 border-b pb-1.5 text-[10px] font-black tracking-widest uppercase">
																<Danger size={12} variant="Bulk" />
																Health Alerts
															</p>
															<ul className="space-y-1">
																{alerts.map((a, i) => (
																	<li key={i} className="text-foreground flex items-center gap-2 text-[11px] font-medium">
																		<span className="bg-destructive h-1.5 w-1.5 rounded-full" />
																		{a.condition}
																	</li>
																))}
															</ul>
														</div>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										) : (
											<div className="flex items-center justify-center">
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger asChild>
															<div className="mx-auto flex h-8 w-8 cursor-help items-center justify-center rounded-xl bg-green-100 text-green-500 transition-all hover:scale-110 active:scale-90">
																<TickCircle size={18} variant="Bulk" />
															</div>
														</TooltipTrigger>
														<TooltipContent className="rounded-lg border-0 bg-green-50 px-2 py-1 text-[11px] font-bold text-green-700">
															No health alerts recorded
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</div>
										)}
									</TableCell>

									{/* Phone Cell */}
									<TableCell className="min-w-[140px] py-4">
										<div className="flex items-center gap-2">
											<Phone size={14} variant="Bold" className="text-primary" />
											<Link
												href={`https://wa.me/${client.phone.replace(/[^0-9]/g, "")}`}
												target="_blank"
												className="group/wa flex size-6 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366] transition-all hover:scale-105 hover:bg-[#25D366] hover:text-white active:scale-95"
											>
												<Whatsapp className="size-4" variant="Bold" />
											</Link>
											<Link
												href={`tel:${client.phone}`}
												className="hover:text-primary text-foreground text-xs font-medium tracking-tight transition-colors"
											>
												{client.phone}
											</Link>
										</div>
									</TableCell>

									{/* Email Cell */}
									<TableCell className="min-w-[180px] py-4">
										{client.email ? (
											<div className="flex items-center gap-2">
												<Mail size={14} variant="Bold" className="text-secondary-2" />
												<Link
													href={`mailto:${client.email}`}
													className="hover:text-secondary-3 text-foreground truncate text-xs font-medium transition-colors"
													title={client.email}
												>
													{client.email}
												</Link>
											</div>
										) : (
											<span className="text-muted-foreground/50 text-[10px] font-bold tracking-widest uppercase italic">No Email</span>
										)}
									</TableCell>

									{/* Actions Cell */}
									<TableCell className="py-4 pr-6 text-right">
										<ClientActions client={client} />
									</TableCell>
								</TableRow>
							);
						})
					)}
				</TableBody>
			</Table>
		</div>
	);
}
