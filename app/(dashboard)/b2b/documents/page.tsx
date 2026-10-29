import Link from "next/link";

import { DocumentDashboardTable } from "@/components/b2b/documents/dashboard-table";
import { Button } from "@/components/ui/button";
import { getDocumentsAction } from "@/lib/actions/b2b/documents";
import { type DocumentStatusFilter, OWED_FILTER, owedSummary } from "@/lib/domain/billing/payments";
import { B2BDocumentType, DocumentWithRelations } from "@/lib/types/b2b";
import { formatMoney } from "@/lib/utils/currency";

import { DocumentText, MoneyTime } from "iconsax-reactjs";

type SearchParams = Promise<{
	query?: string;
	type?: B2BDocumentType;
	status?: DocumentStatusFilter;
	isBackorder?: string;
}>;

export default async function DocumentsPage(props: {
	searchParams: SearchParams;
}) {
	const searchParams = await props.searchParams;
	const query = searchParams.query || "";
	const type = searchParams.type || "all";
	const status = searchParams.status || "all";
	const isBackorder = searchParams.isBackorder === "true";

	const [{ documents, error }, owed] = await Promise.all([
		getDocumentsAction({ query, type, status, isBackorder }),
		getDocumentsAction({ status: OWED_FILTER }),
	]);

	if (error) {
		throw new Error(error);
	}

	const due = owedSummary(owed.documents ?? []);

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

			{due.amount > 0 && status !== OWED_FILTER ? (
				<Link
					href={`/b2b/documents?status=${OWED_FILTER}`}
					className="bg-card zen-shadow hover:border-primary/30 flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors"
				>
					<MoneyTime size={22} variant="Bulk" className="text-primary shrink-0" />
					<span className="min-w-0 flex-1">
						<span className="text-foreground block font-semibold">{formatMoney(due.amount)} owed</span>
						<span className="text-muted-foreground text-sm">
							on {due.count} {due.count === 1 ? "invoice" : "invoices"} waiting for payment
						</span>
					</span>
					<span className="text-primary text-sm font-medium">Show</span>
				</Link>
			) : null}

			<DocumentDashboardTable documents={(documents as DocumentWithRelations[]) || []} />
		</>
	);
}
