"use client";

import { ClientCategory, Gender } from "@/lib/types";

import Link from "next/link";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ClientActions } from "./client-actions";
import { getGoogleContactPhotoAction } from "@/actions/clients";
import { useEffect, useState } from "react";

import { CreditCard, AlertCircle } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

// TODO: Import real type from schema/drizzle
type Client = any;

function ClientAvatar({ client }: { client: Client }) {
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
		<Avatar className="h-9 w-9">
			<AvatarImage src={photoUrl || undefined} alt={client.fullName} />
			<AvatarFallback>{client.fullName.charAt(0)}</AvatarFallback>
		</Avatar>
	);
}

export function ClientsTable({ clients }: { clients: Client[] }) {
	return (
		<div className="rounded-md border">
			<Table>
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
								client.healthLogs?.filter((l: any) => l.isAlert) || [];
							const hasAlerts = alerts.length > 0;

							return (
								<TableRow key={client.id}>
									<TableCell>
										<ClientAvatar client={client} />
									</TableCell>
									<TableCell className="font-medium">
										<Link
											href={`/clients/${client.id}`}
											className="block hover:text-primary hover:underline"
										>
											<div>{client.fullName}</div>
										</Link>
										<div className="text-sm text-muted-foreground">
											{client.email}
										</div>
									</TableCell>
									<TableCell>
										{activeWallet ? (
											<div className="flex flex-col">
												<span className="font-medium text-sm">
													{activeWallet.product?.name}
												</span>
												<div className="flex items-center gap-1 text-xs text-muted-foreground">
													<CreditCard className="h-3 w-3" />
													<span>{activeWallet.remainingCredits} credits</span>
												</div>
											</div>
										) : (
											<span className="text-muted-foreground text-sm">-</span>
										)}
									</TableCell>
									<TableCell className="text-center">
										{hasAlerts && (
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<div className="inline-flex items-center justify-center p-1 rounded-full bg-destructive/10 text-destructive cursor-help">
															<AlertCircle className="h-4 w-4" />
														</div>
													</TooltipTrigger>
													<TooltipContent>
														<ul className="list-disc pl-4 text-xs">
															{alerts.map((a: any, i: number) => (
																<li key={i}>{a.condition}</li>
															))}
														</ul>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										)}
									</TableCell>
									<TableCell>
										<div className="flex flex-col gap-1">
											<Badge variant="secondary" className="capitalize w-fit">
												{client.category?.name || "Uncategorized"}
											</Badge>
											{client.gender && (
												<span className="text-xs text-muted-foreground capitalize">
													{client.gender}
												</span>
											)}
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
