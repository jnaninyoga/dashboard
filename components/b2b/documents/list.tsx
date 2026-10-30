"use client";

import { AmountCell, DocumentCell, DocumentRowCard } from "@/components/b2b/documents/dashboard-table";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { displayStatus } from "@/lib/domain/billing/payments";
import { type DocumentWithContact } from "@/lib/types";
import { studioDateString } from "@/lib/utils/time";

import { type ColumnDef } from "@tanstack/react-table";
import { DocumentText } from "iconsax-reactjs";

import { DocumentStatusBadge } from "./status-badge";

interface DocumentListProps {
	documents: DocumentWithContact[];
	partnerId: string;
}

// A partner's documents: the dashboard's document columns, with the contact
// each one was addressed to in place of the partner.
const columns: ColumnDef<DocumentWithContact>[] = [
	{
		id: "document",
		header: "Document",
		accessorFn: (doc) => doc.issueDate,
		sortDescFirst: true,
		meta: { className: "w-full max-w-0" },
		cell: ({ row }) => <DocumentCell doc={row.original} />,
	},
	{
		id: "contact",
		header: "Contact",
		accessorFn: (doc) => doc.contact?.fullName ?? "",
		meta: { className: "px-5" },
		cell: ({ row }) =>
			row.original.contact?.fullName ? (
				<span className="text-foreground block max-w-48 truncate">{row.original.contact.fullName}</span>
			) : (
				<span className="text-muted-foreground">No contact</span>
			),
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

export function DocumentList({ documents }: DocumentListProps) {
	return (
		<DataTable
			data={documents}
			columns={columns}
			noun={{ one: "document", many: "documents" }}
			pageSize={10}
			initialSorting={[{ id: "document", desc: true }]}
			getRowHref={(doc) => `/b2b/documents/${doc.id}`}
			empty={
				<EmptyState
					icon={<DocumentText size={40} variant="Bulk" />}
					title="No documents yet"
					description="Quotes and invoices for this partner will appear here once created."
				/>
			}
			renderCard={(doc) => <DocumentRowCard doc={doc} subtitle={doc.contact?.fullName || "No contact"} />}
		/>
	);
}
