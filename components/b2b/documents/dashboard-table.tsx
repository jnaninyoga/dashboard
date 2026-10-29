"use client";

import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { DocumentWithRelations } from "@/lib/types/b2b";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { DocumentText, ReceiptText } from "iconsax-reactjs";

import { DocumentFilters } from "./filters";
import { DocumentStatusBadge } from "./status-badge";

interface DocumentDashboardTableProps {
	documents: DocumentWithRelations[];
}

const formatMAD = (n: number) =>
	n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type CardDocument = {
	id: string;
	type: string;
	status: string;
	documentNumber: string;
	issueDate: string;
	totalAmount: string;
	payments?: { amount: string }[] | null;
};

/** A document as a phone card, shared by every document list. */
export function DocumentRowCard({ doc, subtitle }: { doc: CardDocument; subtitle: string }) {
	const paid = doc.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
	const due = Math.max(0, Number(doc.totalAmount) - paid);
	const showDue = doc.type === "invoice" && due > 0;
	return (
		<div className="flex flex-col gap-3">
			{/* Number and who it's for get the full width (the number is what
			    she scans for); status and amount share the line below. */}
			<Link href={`/b2b/documents/${doc.id}`} className="flex min-w-0 items-center gap-3">
				<div className="bg-secondary/40 text-secondary-3 flex size-10 shrink-0 items-center justify-center rounded-xl">
					{doc.type === "invoice" ? (
						<ReceiptText size={20} variant="Bulk" />
					) : (
						<DocumentText size={20} variant="Bulk" />
					)}
				</div>
				<div className="min-w-0">
					<p className="text-foreground truncate text-sm font-bold">{doc.documentNumber}</p>
					<p className="text-muted-foreground truncate text-xs">
						{subtitle} · {format(new Date(doc.issueDate), "dd MMM yyyy")}
					</p>
				</div>
			</Link>
			<div className="border-secondary/15 flex flex-wrap items-end justify-between gap-x-3 gap-y-2 border-t pt-3">
				<DocumentStatusBadge status={doc.status} />
				<div className="shrink-0 text-right">
					<p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
						{showDue ? "Amount due" : "Total"}
					</p>
					<p className={showDue ? "text-warning text-sm font-black tabular-nums" : "text-primary text-sm font-black tabular-nums"}>
						{formatMAD(showDue ? due : Number(doc.totalAmount))} MAD
					</p>
				</div>
			</div>
		</div>
	);
}

export function DocumentDashboardTable({
	documents,
}: DocumentDashboardTableProps) {
	const columns: ColumnDef<DocumentWithRelations>[] = [
		{
			accessorKey: "type",
			header: "Type",
			enableHiding: false,
			cell: ({ row }) => (
				<span className="text-[10px] font-bold tracking-wider uppercase opacity-40">
					{row.original.type}
				</span>
			),
		},
		{
			accessorKey: "documentNumber",
			header: "Document",
			enableHiding: false,
			cell: ({ row }) => {
				const doc = row.original;
				return (
					<Link
						href={`/b2b/documents/${doc.id}`}
						className="flex items-center gap-3"
					>
						<div className="bg-secondary/40 text-secondary-3 group-hover:bg-primary/10 group-hover:text-primary group-hover:zen-glow-teal flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all group-hover:scale-110">
							{doc.type === "invoice" ? (
								<ReceiptText size={20} variant="Bulk" />
							) : (
								<DocumentText size={20} variant="Bulk" />
							)}
						</div>
						<div className="flex min-w-0 flex-col">
							<span className="text-foreground truncate text-sm font-bold tracking-tight">
								{doc.documentNumber}
							</span>
							<span className="text-muted-foreground/60 truncate text-[10px] leading-none font-medium">
								{format(new Date(doc.issueDate), "MMM dd, yyyy")}
							</span>
						</div>
					</Link>
				);
			},
		},
		{
			id: "partner",
			accessorFn: (row) => row.partner?.companyName,
			header: "Partner",
			enableHiding: false,
			cell: ({ row }) => {
				const doc = row.original;
				const contactName = doc.contact?.fullName;
				const companyName = doc.partner?.companyName;

				return (
					<Link
						href={`/b2b/partners/${doc.partnerId}`}
						className="group/partner flex min-w-0 flex-col"
					>
						<span className="text-foreground group-hover/partner:text-primary truncate text-sm transition-colors">
							{contactName ? (
								<>
									<span className="font-bold">{contactName}</span> @ {companyName}
								</>
							) : (
								<span className="font-bold">{companyName}</span>
							)}
						</span>
					</Link>
				);
			},
		},
		{
			accessorKey: "status",
			header: "Status",
			enableHiding: false,
			cell: ({ row }) => <DocumentStatusBadge status={row.original.status} />,
		},
		{
			id: "backorder",
			header: "Backorder",
			accessorFn: (row) => (row.type === "invoice" && row.parentDocumentId ? "Yes" : "No"),
			cell: ({ row }) => {
				const isBackorder = row.original.type === "invoice" && !!row.original.parentDocumentId;
				return isBackorder ? (
					<span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold tracking-widest text-purple-600 uppercase">
						Yes
					</span>
				) : (
					<span className="text-muted-foreground text-xs">-</span>
				);
			},
		},
		{
			id: "totalPayments",
			header: "Total Payments",
			accessorFn: (row) =>
				row.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
			cell: ({ row }) => {
				if (row.original.type === "quote") return <span className="text-muted-foreground text-xs">—</span>;
				const totalPayments =
					row.original.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
				return (
					<span className="text-muted-foreground text-sm font-semibold tabular-nums">
						{totalPayments.toLocaleString("en-US", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}{" "}
						MAD
					</span>
				);
			},
		},
		{
			id: "totalAmountDue",
			header: "Amount Due",
			accessorFn: (row) => {
				const totalPayments =
					row.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
				return Number(row.totalAmount) - totalPayments;
			},
			cell: ({ row }) => {
				if (row.original.type === "quote") return <span className="text-muted-foreground text-xs">—</span>;
				const totalAmount = Number(row.original.totalAmount);
				const totalPayments =
					row.original.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
				const amountDue = Math.max(0, totalAmount - totalPayments);
				
				return (
					<span className="text-warning text-sm font-bold tabular-nums">
						{amountDue.toLocaleString("en-US", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}{" "}
						MAD
					</span>
				);
			},
		},
		{
			accessorKey: "totalAmount",
			header: () => <div className="text-right">Total Amount</div>,
			enableHiding: false,
			cell: ({ row }) => {
				return (
					<div className="text-primary text-right text-sm font-black tabular-nums">
						{parseFloat(row.original.totalAmount).toLocaleString("en-US", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}{" "}
						MAD
					</div>
				);
			},
		},

	];

	return (
		<DataTable
			data={documents}
			columns={columns}
			toolbar={<DocumentFilters />}
			columnToggle
			noun={{ one: "document", many: "documents" }}
			getRowHref={(doc) => `/b2b/documents/${doc.id}`}
			empty={
				<EmptyState
					icon={<DocumentText size={40} variant="Bulk" />}
					title="No documents"
					description="Nothing matches these filters. Try another search, or create a quotation."
				/>
			}
			renderCard={(doc) => (
				<DocumentRowCard doc={doc} subtitle={doc.partner?.companyName ?? "—"} />
			)}
		/>
	);
}
