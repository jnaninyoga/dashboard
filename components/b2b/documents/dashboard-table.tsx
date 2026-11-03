"use client";

import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { documentKind, documentName } from "@/lib/domain/billing/document-name";
import { documentAmounts } from "@/lib/domain/billing/payments";
import { displayStatus } from "@/lib/domain/billing/payments";
import { DocumentWithRelations } from "@/lib/types/b2b";
import { formatMoney } from "@/lib/utils/currency";
import { formatDay } from "@/lib/utils/time";
import { studioDateString } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";

import { ColumnDef } from "@tanstack/react-table";
import { DocumentText, ReceiptText } from "iconsax-reactjs";

import { DocumentFilters } from "./filters";
import { DocumentStatusBadge } from "./status-badge";

type ListDocument = {
	id: string;
	type: string;
	status: string;
	documentNumber: string | null;
	issueDate: string;
	dueDate?: string | null;
	totalAmount: string;
	parentDocumentId?: string | null;
	parent?: { documentNumber: string | null } | null;
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
	// An invoice says which quotation it bills.
	const quote = doc.type === "invoice" && doc.parent?.documentNumber ? doc.parent.documentNumber : null;
	return (
		<div className="flex min-w-0 items-center gap-3">
			<DocumentIcon type={doc.type} />
			<div className="flex min-w-0 flex-col">
				<Link
					href={`/b2b/documents/${doc.id}`}
					title={documentName(doc)}
					className="truncate rounded-sm font-semibold text-foreground transition-colors outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
				>
					{documentName(doc)}
				</Link>
				<span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
					<span className="truncate">
						{documentKind(doc.type)} · {issued(doc)}
					</span>
					{quote ? (
						<span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
							{quote}
						</span>
					) : null}
				</span>
			</div>
		</div>
	);
}

/** The total, and underneath what an invoice still owes (amber) or that it's settled. */
export function AmountCell({ doc, align = "right" }: { doc: ListDocument; align?: "left" | "right" }) {
	const { total, due, toRefund } = documentAmounts(doc);
	return (
		<div className={cn("flex flex-col", align === "right" ? "items-end text-right" : "items-start")}>
			<span className="font-semibold text-foreground tabular-nums">{formatMoney(total)}</span>
			{due > 0 ? (
				<span className="text-sm font-medium text-warning tabular-nums">Due {formatMoney(due)}</span>
			) : toRefund > 0 ? (
				<span className="text-sm font-medium text-warning tabular-nums">To refund {formatMoney(toRefund)}</span>
			) : doc.type === "invoice" && doc.status === "paid" ? (
				<span className="text-sm text-success">Paid in full</span>
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
					<Link href={`/b2b/documents/${doc.id}`} className="truncate font-semibold text-foreground">
						{documentName(doc)}
					</Link>
					<span className="truncate text-sm text-muted-foreground">
						{subtitle} · {issued(doc)}
					</span>
				</div>
			</div>
			<div className="flex items-end justify-between gap-3 border-t border-border/60 pt-3">
				<DocumentStatusBadge status={displayStatus(doc, studioDateString())} />
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
						className="truncate font-medium text-foreground transition-colors hover:text-primary"
					>
						{doc.partner?.companyName ?? "—"}
					</Link>
					{doc.contact?.fullName ? (
						<span className="truncate text-sm text-muted-foreground">{doc.contact.fullName}</span>
					) : null}
				</div>
			);
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		meta: { className: "px-5" },
		cell: ({ row }) => <DocumentStatusBadge status={displayStatus(row.original, studioDateString())} />,
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
