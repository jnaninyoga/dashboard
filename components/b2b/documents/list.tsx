"use client";

import Link from "next/link";

import { DocumentRowCard } from "@/components/b2b/documents/dashboard-table";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { type DocumentWithContact } from "@/lib/types";

import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { DocumentText, ReceiptText } from "iconsax-reactjs";

import { DocumentStatusBadge } from "./status-badge";

interface DocumentListProps {
	documents: DocumentWithContact[];
	partnerId: string;
}

const columns: ColumnDef<DocumentWithContact>[] = [
	{
		accessorKey: "type",
		header: "Type",
		cell: ({ row }) => (
			<span className="text-[10px] font-bold tracking-wider uppercase opacity-40">{row.original.type}</span>
		),
	},
	{
		id: "document",
		accessorKey: "documentNumber",
		header: "Document",
		cell: ({ row }) => {
			const doc = row.original;
			return (
				<Link href={`/b2b/documents/${doc.id}`} className="flex items-center gap-3">
					<div className="bg-secondary/40 text-secondary-3 group-hover:bg-primary/10 group-hover:text-primary flex h-10 w-10 items-center justify-center rounded-xl transition-all">
						{doc.type === "invoice" ? <ReceiptText size={20} variant="Bulk" /> : <DocumentText size={20} variant="Bulk" />}
					</div>
					<div className="flex flex-col">
						<span className="text-foreground text-sm font-bold tracking-tight">{doc.documentNumber}</span>
						<span className="text-muted-foreground/60 text-[10px] leading-none font-medium">
							{doc.contact?.fullName || "No contact linked"}
						</span>
					</div>
				</Link>
			);
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => <DocumentStatusBadge status={row.original.status} />,
	},
	{
		accessorKey: "issueDate",
		header: "Issued",
		cell: ({ row }) => (
			<span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-70">
				{format(new Date(row.original.issueDate), "MMM dd, yyyy")}
			</span>
		),
	},
	{
		id: "amount",
		accessorFn: (doc) => Number(doc.totalAmount),
		header: () => <div className="text-right">Amount</div>,
		cell: ({ row }) => (
			<div className="text-primary text-right text-sm font-black tabular-nums">
				{Number(row.original.totalAmount).toLocaleString("en-US", {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				})}{" "}
				MAD
			</div>
		),
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
			renderCard={(doc) => (
				<DocumentRowCard doc={doc} subtitle={doc.contact?.fullName || "No contact linked"} />
			)}
		/>
	);
}
