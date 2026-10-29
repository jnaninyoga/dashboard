"use client";

import { EmptyState } from "@/components/empty-state";
import { type ClientWithRelations as Client } from "@/lib/types";

import { People } from "iconsax-reactjs";

import { ClientCard } from "./client-card";

export function ClientsGrid({ clients }: { clients: Client[] }) {
	if (clients.length === 0) {
		return (
			<EmptyState
				icon={<People size={40} variant="Bulk" />}
				title="No clients found"
				description="Adjust your filters, or add a new client."
			/>
		);
	}

	return (
		<div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-4">
			{clients.map((client) => (
				<ClientCard key={client.id} client={client} />
			))}
		</div>
	);
}
