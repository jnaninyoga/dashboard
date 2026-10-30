import Link from "next/link";

import { DocumentDashboardTable } from "@/components/b2b/documents/dashboard-table";
import { Button } from "@/components/ui/button";
import { getDocumentsAction } from "@/lib/actions/b2b/documents";
import { type DocumentStatusFilter, isOverdue, OVERDUE_FILTER, OWED_FILTER, owedSummary } from "@/lib/domain/billing/payments";
import { B2BDocumentType, DocumentWithRelations } from "@/lib/types/b2b";
import { formatMoney } from "@/lib/utils/currency";
import { studioDateString } from "@/lib/utils/time";

import { Danger, DocumentText, MoneyTime } from "iconsax-reactjs";

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
	// What's late comes first when chasing payments.
	const today = studioDateString();
	const overdue = owedSummary((owed.documents ?? []).filter((doc) => isOverdue(doc, today)));

	return (
		<>
			<div className="animate-slide-up flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<header className="space-y-1">
					<h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">
						Documents
					</h1>
					<p className="text-md text-muted-foreground">
						Quotations and invoices for the hotels and companies you teach for.
					</p>
				</header>
				<Button asChild className="zen-glow-teal min-h-11 gap-2 rounded-full px-5 font-semibold">
					<Link href="/b2b/documents/new">
						<DocumentText size={20} className="size-5" variant="Bold" />
						New quotation
					</Link>
				</Button>
			</div>

			{due.amount > 0 && status !== OWED_FILTER ? (
				<div className="bg-card zen-shadow flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3">
					<MoneyTime size={22} variant="Bulk" className="text-primary shrink-0" />
					<Link
						href={`/b2b/documents?status=${OWED_FILTER}`}
						className="group focus-visible:ring-ring min-w-0 flex-1 rounded-lg outline-none focus-visible:ring-2"
					>
						<span className="text-foreground group-hover:text-primary block font-semibold">{formatMoney(due.amount)} owed</span>
						<span className="text-muted-foreground text-sm">
							on {due.count} {due.count === 1 ? "invoice" : "invoices"} waiting for payment
						</span>
					</Link>
					{overdue.count > 0 && status !== OVERDUE_FILTER ? (
						<Link
							href={`/b2b/documents?status=${OVERDUE_FILTER}`}
							className="bg-destructive/10 text-destructive hover:bg-destructive/15 focus-visible:ring-ring inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold outline-none focus-visible:ring-2"
						>
							<Danger size={16} variant="Bold" aria-hidden />
							{overdue.count} overdue · {formatMoney(overdue.amount)}
						</Link>
					) : null}
				</div>
			) : null}

			<DocumentDashboardTable documents={(documents as DocumentWithRelations[]) || []} />
		</>
	);
}
