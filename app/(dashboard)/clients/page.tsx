import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { ClientsTable } from "@/components/clients/clients-table";
import { ClientsGrid } from "@/components/clients/clients-grid";
import { ClientFilters } from "@/components/clients/client-filters";
import { ClientViewToggle } from "@/components/clients/client-view-toggle";
import { getClientsAction } from "@/actions/clients";
import { ClientCategory, Gender, View } from "@/lib/types";

type SearchParams = Promise<{
	view: View;
	query: string;
	category: ClientCategory;
	gender: Gender;
	page: number;
}>;

export default async function ClientsPage(props: {
	searchParams: SearchParams;
}) {
	const searchParams = await props.searchParams;
	const view = searchParams.view || View.GRID;
	const query = searchParams.query || "";
	const category = searchParams.category || ClientCategory.ALL;
	const gender = searchParams.gender || Gender.ALL;
	const page = searchParams.page || 1;

	const { data: clients, error } = await getClientsAction(page, 50, query, {
		category,
		gender,
	});

	if (error) {
		return <div className="p-8 text-red-500">Error: {error}</div>;
	}

	return (
		<main className="flex flex-col gap-6 p-6">
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

			{view === View.GRID ? (
				<ClientsGrid clients={clients || []} />
			) : (
				<ClientsTable clients={clients || []} />
			)}
		</main>
	);
}
