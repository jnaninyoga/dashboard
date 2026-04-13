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

import { Card, Danger } from "iconsax-reactjs";

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
			<AvatarFallback>{client.fullName.charAt(0)}</AvatarFallback>
		</Avatar>
	);
}

export function ClientsTable({ clients }: { clients: ClientWithRelations[] }) {
	return (
		<div className="relative w-full overflow-x-auto rounded-md border bg-white p-2">
			<Table className="[&_tr]:border-secondary-foreground/10">
				<TableHeader>
					<TableRow>
						<TableHead className="w-[50px]"></TableHead>
						<TableHead>Name</TableHead>
						<TableHead>Membership</TableHead>
						<TableHead className="w-[50px] text-center">Health</TableHead>
						<TableHead>Category</TableHead>
						<TableHead>Phone</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{clients.length === 0 ? (
						<TableRow>
							<TableCell colSpan={7} className="h-24 text-center">
								No clients found.
							</TableCell>
						</TableRow>
					) : (
						clients.map((client) => {
							const activeWallet = client.wallets?.[0];
							const alerts =
								client.healthLogs?.filter((l) => l.isAlert) || [];
							const hasAlerts = alerts.length > 0;

							return (
								<TableRow key={client.id}>
									<TableCell>
										<ClientAvatar client={client} />
									</TableCell>
									<TableCell className="align-top font-medium">
										<div className="flex items-center gap-2">
											<Link
												href={`/clients/${client.id}`}
												className="hover:text-primary block hover:underline"
											>
												<span className="font-bold text-gray-900">{client.fullName}</span>
											</Link>
											{client.activeSessionName ? (
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger asChild>
															<div className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-green-700 shadow-sm">
																<span className="relative flex h-1.5 w-1.5">
																  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
																  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
																</span>
																<span className="max-w-[100px] truncate text-[9px] font-bold tracking-wider uppercase">
																	{client.activeSessionName}
																</span>
															</div>
														</TooltipTrigger>
														<TooltipContent>
															<p className="text-xs font-semibold text-green-600">
																Checked in today
															</p>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											) : null}
										</div>
										<div className="text-muted-foreground mt-0.5 text-sm">
											{client.email}
										</div>
									</TableCell>
									<TableCell>
										{activeWallet ? (
											<div className="flex flex-col">
												<span className="text-sm font-medium">
													{activeWallet.product?.name}
												</span>
												<div className="text-muted-foreground flex items-center gap-1 text-xs">
													<Card className="h-3 w-3" variant="Outline" />
													<span>{activeWallet.remainingCredits} credits</span>
												</div>
											</div>
										) : (
											<span className="text-muted-foreground text-sm">-</span>
										)}
									</TableCell>
									<TableCell className="text-center">
										{hasAlerts ? (
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<div className="bg-destructive/10 text-destructive inline-flex cursor-help items-center justify-center rounded-full p-1">
															<Danger className="h-4 w-4" variant="Bulk" />
														</div>
													</TooltipTrigger>
													<TooltipContent>
														<ul className="list-disc pl-4 text-xs">
															{alerts.map((a, i) => (
																<li key={i}>{a.condition}</li>
															))}
														</ul>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										) : null}
									</TableCell>
									<TableCell>
										<div className="flex flex-col gap-1">
											<Badge variant="secondary" className="w-fit capitalize">
												{client.category?.name || "Uncategorized"}
											</Badge>
											{client.gender ? (
												<span className="text-muted-foreground text-xs capitalize">
													{client.gender}
												</span>
											) : null}
										</div>
									</TableCell>
									<TableCell className="text-sm">{client.phone}</TableCell>
									<TableCell className="text-right">
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
