"use client";

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
						<TableHead>Category</TableHead>
						<TableHead>Gender</TableHead>
						<TableHead>Phone</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{clients.length === 0 ? (
						<TableRow>
							<TableCell colSpan={6} className="h-24 text-center">
								No clients found.
							</TableCell>
						</TableRow>
					) : (
						clients.map((client) => (
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
									<Badge variant="secondary" className="capitalize">
										{client.category}
									</Badge>
								</TableCell>
								<TableCell className="capitalize">
									{client.gender || "-"}
								</TableCell>
								<TableCell>{client.phone}</TableCell>
								<TableCell className="text-right">
									<ClientActions client={client} />
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}
