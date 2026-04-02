import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { ClientsTable } from "@/components/clients/clients-table";
import { ClientsGrid } from "@/components/clients/clients-grid";
import { ClientFilters } from "@/components/clients/client-filters";
import { ClientViewToggle } from "@/components/clients/client-view-toggle";
import { getClientsAction } from "@/actions/clients";
import { ClientCategory, Gender, View } from "@/lib/types";

import { getClientCategories } from "@/actions/settings";

type SearchParams = Promise<{
	view: View;
	query: string;
	categoryId: string;
	gender: Gender;
	page: number;
}>;

export default async function ClientsPage(props: {
	searchParams: SearchParams;
}) {
	const searchParams = await props.searchParams;
	const view = searchParams.view || View.GRID;
	const query = searchParams.query || "";
	const categoryId = searchParams.categoryId || "all";
	const gender = searchParams.gender || Gender.ALL;
	const page = searchParams.page || 1;

	// Fetch categories for filter
	const categories = await getClientCategories();

	const { data: clients, error } = await getClientsAction(page, 50, query, {
		categoryId,
		gender,
	});

	if (error) {
		return <div className="p-8 text-red-500">Error: {error}</div>;
	}

	return (
		<>
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<header className="space-y-1">
					<h1 className="text-3xl md:text-4xl font-heading font-medium tracking-tight text-foreground">Clients</h1>
					<p className="text-md text-muted-foreground">
						Manage your client base and view their progress.
					</p>
				</header>
				<Link href="/clients/add">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Add Client
					</Button>
				</Link>
			</div>

			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<ClientFilters categories={categories || []} />
				<ClientViewToggle />
			</div>

			{view === View.GRID ? (
				<ClientsGrid clients={clients || []} />
			) : (
				<ClientsTable clients={clients || []} />
			)}
		</>
	);
}
