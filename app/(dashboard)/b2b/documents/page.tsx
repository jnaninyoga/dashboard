import Link from "next/link";

import { DocumentDashboardTable } from "@/components/b2b/documents/dashboard-table";
import { DocumentFilters } from "@/components/b2b/documents/filters";
import { Button } from "@/components/ui/button";
import { getDocumentsAction } from "@/lib/actions/b2b/documents";
import { B2BDocumentStatus, B2BDocumentType, DocumentWithRelations } from "@/lib/types/b2b";

import { DocumentText } from "iconsax-reactjs";
import DocumentNotFound from "@/components/b2b/documents/not-found";

type SearchParams = Promise<{
	query?: string;
	type?: B2BDocumentType;
	status?: B2BDocumentStatus;
}>;

export default async function DocumentsPage(props: {
	searchParams: SearchParams;
}) {
	const searchParams = await props.searchParams;
	const query = searchParams.query || "";
	const type = searchParams.type || "all";
	const status = searchParams.status || "all";

	const { documents, error } = await getDocumentsAction({
		query,
		type,
		status,
	});

	if (error) {
		throw new Error(error);
	}

	return (
		<>
			<div className="animate-slide-up flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<header className="space-y-1">
					<h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">
						B2B Documents
					</h1>
					<p className="text-md text-muted-foreground">
						Unified management of all Quotations and Invoices.
					</p>
				</header>
				<Link href="/b2b/documents/new">
					<Button className="zen-glow-teal h-11 px-8 font-bold shadow-sm transition-all">
						<DocumentText className="mr-2 size-4" variant="Bold" />
						New Quotation
					</Button>
				</Link>
			</div>

			<div className="animate-slide-up flex flex-col gap-4 delay-100 md:flex-row md:items-center md:justify-between">
				<DocumentFilters />
			</div>

			<DocumentDashboardTable documents={(documents as DocumentWithRelations[]) || []} />

			{!documents?.length ? (
				<DocumentNotFound message="Try adjusting your filters or search query." />
			) : null}
		</>
	);
}
