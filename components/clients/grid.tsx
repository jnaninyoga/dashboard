"use client";

import { type ClientWithRelations as Client } from "@/lib/types";

import { ClientCard } from "./client-card";

export function ClientsGrid({ clients }: { clients: Client[] }) {
	if (clients.length === 0) {
		return (
			<div className="animate-slide-up flex h-64 items-center justify-center rounded-md border border-dashed delay-150">
				<p className="text-muted-foreground">No clients found.</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
			{clients.map((client) => (
				<ClientCard key={client.id} client={client} />
			))}
		</div>
	);
}
