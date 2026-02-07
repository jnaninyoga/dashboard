import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

import { ClientsTable } from "@/components/clients/clients-table";
import { ClientsGrid } from "@/components/clients/clients-grid";
import { ClientFilters } from "@/components/clients/client-filters";
import { ClientViewToggle } from "@/components/clients/client-view-toggle";
import { getClientsAction } from "@/actions/clients";

// Next.js 15+ searchParams types
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ClientsPage(props: {
	searchParams: SearchParams;
}) {
	const searchParams = await props.searchParams;
	const view = (searchParams.view as string) || "grid";
	const query = (searchParams.query as string) || "";
	const category = (searchParams.category as string) || "all";
	const gender = (searchParams.gender as string) || "all";
	const page = Number(searchParams.page) || 1;

	const { data: clients, error } = await getClientsAction(page, 50, query, {
		category,
		gender,
	});

	if (error) {
		return <div className="p-8 text-red-500">Error: {error}</div>;
	}

	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Clients</h1>
					<p className="text-muted-foreground">
						Manage your client base and view their progress.
					</p>
				</div>
				<Link href="/clients/add">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Add Client
					</Button>
				</Link>
			</div>

			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<ClientFilters />
				<ClientViewToggle />
			</div>

			<Suspense fallback={<ClientsLoading />}>
				{view === "grid" ? (
					<ClientsGrid clients={clients || []} />
				) : (
					<ClientsTable clients={clients || []} />
				)}
			</Suspense>
		</div>
	);
}

function ClientsLoading() {
	return (
		<div className="flex h-64 items-center justify-center">
			<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
		</div>
	);
}
