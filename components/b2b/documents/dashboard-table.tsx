"use client";

import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { documentAmounts } from "@/lib/domain/billing/payments";
import { DocumentWithRelations } from "@/lib/types/b2b";
import { formatMoney } from "@/lib/utils/currency";
import { formatDay } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";

import { ColumnDef } from "@tanstack/react-table";
import { DocumentText, ReceiptText } from "iconsax-reactjs";

import { DocumentFilters } from "./filters";
import { DocumentStatusBadge } from "./status-badge";

type ListDocument = {
	id: string;
	type: string;
	status: string;
	documentNumber: string;
	issueDate: string;
	totalAmount: string;
	parentDocumentId?: string | null;
	archivedAt?: Date | string | null;
	payments?: { amount: string }[] | null;
};

const issued = (doc: ListDocument) => formatDay(doc.issueDate, { day: "numeric", month: "short", year: "numeric" });

/** Quote or invoice, at a glance: a blush tile for quotes, teal for invoices. */
function DocumentIcon({ type, className }: { type: string; className?: string }) {
	const invoice = type === "invoice";
	return (
		<span
			className={cn(
				"flex size-10 shrink-0 items-center justify-center rounded-xl",
				invoice ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-3",
				className,
			)}
		>
			{invoice ? <ReceiptText size={20} variant="Bulk" /> : <DocumentText size={20} variant="Bulk" />}
		</span>
	);
}

/** The document: its number (what she scans for), then what it is and when. */
export function DocumentCell({ doc }: { doc: ListDocument }) {
	const backorder = doc.type === "invoice" && !!doc.parentDocumentId;
	return (
		<div className="flex min-w-0 items-center gap-3">
			<DocumentIcon type={doc.type} />
			<div className="flex min-w-0 flex-col">
				<Link
					href={`/b2b/documents/${doc.id}`}
					title={doc.documentNumber}
					className="text-foreground hover:text-primary focus-visible:ring-ring truncate rounded-sm font-semibold transition-colors outline-none focus-visible:ring-2"
				>
					{doc.documentNumber}
				</Link>
				<span className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-sm">
					<span className="truncate">
						{doc.type === "invoice" ? "Invoice" : "Quotation"} · {issued(doc)}
					</span>
					{/* The part of a quote billed later, after a partial invoice. */}
					{backorder ? (
						<span className="bg-secondary text-secondary-foreground shrink-0 rounded-full px-2 py-0.5 text-xs font-medium">
							Backorder
						</span>
					) : null}
				</span>
			</div>
		</div>
	);
}

/** The total, and underneath what an invoice still owes (amber) or that it's settled. */
export function AmountCell({ doc, align = "right" }: { doc: ListDocument; align?: "left" | "right" }) {
	const { total, due } = documentAmounts(doc);
	return (
		<div className={cn("flex flex-col", align === "right" ? "items-end text-right" : "items-start")}>
			<span className="text-foreground font-semibold tabular-nums">{formatMoney(total)}</span>
			{due > 0 ? (
				<span className="text-warning text-sm font-medium tabular-nums">Due {formatMoney(due)}</span>
			) : doc.type === "invoice" && doc.status === "paid" ? (
				<span className="text-success text-sm">Paid in full</span>
			) : null}
		</div>
	);
}

/** A document as a phone card, shared by every document list. */
export function DocumentRowCard({ doc, subtitle }: { doc: ListDocument; subtitle: string }) {
	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-start gap-3">
				<DocumentIcon type={doc.type} />
				<div className="flex min-w-0 flex-1 flex-col">
					<Link href={`/b2b/documents/${doc.id}`} className="text-foreground truncate font-semibold">
						{doc.documentNumber}
					</Link>
					<span className="text-muted-foreground truncate text-sm">
						{subtitle} · {issued(doc)}
					</span>
				</div>
			</div>
			<div className="border-border/60 flex items-end justify-between gap-3 border-t pt-3">
				<DocumentStatusBadge status={doc.status} />
				<AmountCell doc={doc} />
			</div>
		</div>
	);
}

const columns: ColumnDef<DocumentWithRelations>[] = [
	{
		id: "document",
		header: "Document",
		// Newest first by default; the number column takes the spare width.
		accessorFn: (doc) => doc.issueDate,
		sortDescFirst: true,
		meta: { className: "w-full max-w-0" },
		cell: ({ row }) => <DocumentCell doc={row.original} />,
	},
	{
		id: "partner",
		header: "Partner",
		accessorFn: (doc) => doc.partner?.companyName ?? "",
		meta: { className: "px-5" },
		cell: ({ row }) => {
			const doc = row.original;
			return (
				<div className="flex max-w-56 min-w-0 flex-col">
					<Link
						href={`/b2b/partners/${doc.partnerId}`}
						className="text-foreground hover:text-primary truncate font-medium transition-colors"
					>
						{doc.partner?.companyName ?? "—"}
					</Link>
					{doc.contact?.fullName ? (
						<span className="text-muted-foreground truncate text-sm">{doc.contact.fullName}</span>
					) : null}
				</div>
			);
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		meta: { className: "px-5" },
		cell: ({ row }) => <DocumentStatusBadge status={row.original.status} />,
	},
	{
		id: "amount",
		header: () => <div className="text-right">Amount</div>,
		accessorFn: (doc) => Number(doc.totalAmount),
		cell: ({ row }) => <AmountCell doc={row.original} />,
	},
];

export function DocumentDashboardTable({ documents }: { documents: DocumentWithRelations[] }) {
	return (
		<DataTable
			data={documents}
			columns={columns}
			toolbar={<DocumentFilters />}
			noun={{ one: "document", many: "documents" }}
			initialSorting={[{ id: "document", desc: true }]}
			getRowHref={(doc) => `/b2b/documents/${doc.id}`}
			empty={
				<EmptyState
					icon={<DocumentText size={40} variant="Bulk" />}
					title="No documents"
					description="Nothing matches these filters. Try another search, or create a quotation."
				/>
			}
			renderCard={(doc) => <DocumentRowCard doc={doc} subtitle={doc.partner?.companyName ?? "—"} />}
		/>
	);
}
