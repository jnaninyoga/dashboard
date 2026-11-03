import Link from "next/link";

import { ClientFilters } from "@/components/clients/filters";
import { ClientsGrid } from "@/components/clients/grid";
import { ClientsTable } from "@/components/clients/table";
import { ClientViewToggle } from "@/components/clients/view-toggle";
import { Button } from "@/components/ui/button";
import { getClientsAction } from "@/lib/actions/clients/queries";
import { getDiscounts } from "@/lib/actions/settings";
import { Gender, View } from "@/lib/types";

import { Add } from "iconsax-reactjs";

type SearchParams = Promise<{
	view: View;
	query: string;
	discountId: string;
	gender: Gender;
	page: number;
}>;

export default async function ClientsPage(props: {
	searchParams: SearchParams;
}) {
	const searchParams = await props.searchParams;
	const view = searchParams.view || View.GRID;
	const query = searchParams.query || "";
	const discountId = searchParams.discountId || "all";
	const gender = searchParams.gender || Gender.ALL;
	const page = searchParams.page || 1;

	// Fetch discounts for filter
	const discounts = await getDiscounts();

	const { data: clients, error } = await getClientsAction(page, 50, query, {
		discountId,
		gender,
	});

	// The shared error screen gives the operator a code to report.
	if (error) {
		throw new Error(error);
	}

	return (
		<>
			<div className="flex animate-slide-up flex-col justify-between gap-4 md:flex-row md:items-center">
				<h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">
					Clients
				</h1>
				<Link href="/clients/add">
					<Button className="zen-glow-teal h-11 px-8 font-bold shadow-sm transition-all">
						<Add className="mr-2 size-4" variant="Outline" />
						Add client
					</Button>
				</Link>
			</div>

			<div className="flex animate-slide-up flex-col gap-4 delay-100 md:flex-row md:items-start md:justify-between">
				<ClientFilters discounts={discounts || []} />
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
