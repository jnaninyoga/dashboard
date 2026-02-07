"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientActions } from "./client-actions";
import { getGoogleContactPhotoAction } from "@/actions/clients";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, MapPin, Briefcase, Calendar } from "lucide-react";

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
}

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
		<Avatar className="h-20 w-20 border-2 border-background shadow-md">
			<AvatarImage src={photoUrl || undefined} alt={client.fullName} />
			<AvatarFallback className="text-2xl bg-primary/10 text-primary font-semibold">
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
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{clients.map((client) => (
				<Card
					key={client.id}
					className="group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 border-muted/60"
				>
					<div className="absolute right-3 top-3 z-10">
						<ClientActions client={client} />
					</div>

					<CardContent className="flex flex-col items-center p-6 pt-8 space-y-4 text-center">
						<Link
							href={`/clients/${client.id}`}
							className="flex flex-col items-center gap-4 w-full"
						>
							<ClientAvatar client={client} />
							<div className="space-y-1 w-full">
								<h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
									{client.fullName}
								</h3>
								{client.profession ? (
									<p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
										<Briefcase className="h-3.5 w-3.5" />
										{client.profession}
									</p>
								) : (
									<p className="text-sm text-muted-foreground capitalize">
										{client.category}
									</p>
								)}
							</div>
						</Link>

						{/* Status Badges */}
						<div className="flex flex-wrap justify-center gap-2">
							{client.gender && (
								<Badge
									variant="secondary"
									className="capitalize text-xs font-medium px-2.5 py-0.5"
								>
									{client.gender}
								</Badge>
							)}
							<Badge
								variant="outline"
								className="capitalize text-xs font-medium text-muted-foreground px-2.5 py-0.5"
							>
								{client.category}
							</Badge>
						</div>

						{/* Separator-like visual */}
						<div className="w-full border-t border-border/50 my-2"></div>

						{/* Contact Info Grid */}
						<div className="flex flex-col gap-2.5 text-sm text-muted-foreground w-full">
							<div className="flex items-center justify-center gap-2">
								<Phone className="h-4 w-4 shrink-0 opacity-70" />
								<span className="truncate font-medium">{client.phone}</span>
							</div>
							{client.birthDate && (
								<div className="flex items-center justify-center gap-2">
									<Calendar className="h-4 w-4 shrink-0 opacity-70" />
									<span className="truncate">{client.birthDate}</span>
								</div>
							)}
							{client.email && (
								<div className="flex items-center justify-center gap-2">
									<Mail className="h-4 w-4 shrink-0 opacity-70" />
									<span className="truncate max-w-[200px]" title={client.email}>
										{client.email}
									</span>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
