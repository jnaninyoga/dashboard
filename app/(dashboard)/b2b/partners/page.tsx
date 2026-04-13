import { getPartnersAction } from "@/actions/b2b/partners";
import { PartnerDialog } from "@/components/b2b/partners/dialog";
import { PartnerFilters } from "@/components/b2b/partners/filters";
import { PartnerGrid } from "@/components/b2b/partners/grid";
import { PartnerTable } from "@/components/b2b/partners/table";
import { PartnerViewToggle } from "@/components/b2b/partners/view-toggle";
import { Button } from "@/components/ui/button";
import { View } from "@/lib/types";
import { B2BDocumentStatus, B2BDocumentType } from "@/lib/types/b2b";

import { Add } from "iconsax-reactjs";

type SearchParams = Promise<{
	view: View;
	query?: string;
	docType?: B2BDocumentType;
	docStatus?: B2BDocumentStatus;
}>;

export default async function PartnersPage(props: {
	searchParams: SearchParams;
}) {
	const searchParams = await props.searchParams;
	const view = searchParams.view || View.GRID;
	const query = searchParams.query || "";
	const docType = searchParams.docType || "all";
	const docStatus = searchParams.docStatus || "all";

	const { partners, error } = await getPartnersAction({
		query,
		docType,
		docStatus,
	});

	if (error) {
		throw new Error(error);
	}

	return (
		<>
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<header className="space-y-1">
					<h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">
						B2B Partners
					</h1>
					<p className="text-md text-muted-foreground">
						Manage your relationships with Hotels, Riads, and companies.
					</p>
				</header>
				<PartnerDialog>
					<Button className="shadow-sm">
						<Add className="mr-2 h-4 w-4" variant="Outline" />
						New Partner
					</Button>
				</PartnerDialog>
			</div>

			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<PartnerFilters />
				<PartnerViewToggle />
			</div>

			{view === View.GRID ? (
				<PartnerGrid partners={partners || []} />
			) : (
				<PartnerTable partners={partners || []} />
			)}
		</>
	);
}
