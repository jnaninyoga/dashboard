import { PartnerDialog } from "@/components/b2b/partners/dialog";
import { PartnerFilters } from "@/components/b2b/partners/filters";
import { PartnerGrid } from "@/components/b2b/partners/grid";
import { PartnerTable } from "@/components/b2b/partners/table";
import { PartnerViewToggle } from "@/components/b2b/partners/view-toggle";
import { Button } from "@/components/ui/button";
import { getPartnersAction } from "@/lib/actions/b2b/partners";
import { type DocumentStatusFilter } from "@/lib/domain/billing/payments";
import { View } from "@/lib/types";
import { B2BDocumentType } from "@/lib/types/b2b";

import { Add } from "iconsax-reactjs";

type SearchParams = Promise<{
	view: View;
	query?: string;
	docType?: B2BDocumentType;
	docStatus?: DocumentStatusFilter;
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
				<h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">
					Partners
				</h1>
				<PartnerDialog>
					<Button className="zen-glow-teal h-11 px-8 font-bold shadow-sm transition-all">
						<Add className="mr-2 h-4 w-4" variant="Outline" />
						New partner
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
