"use client";

import Link from "next/link";

import { CopyableTaxId } from "@/components/b2b/copyable-tax-id";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { type PartnerWithRelations } from "@/lib/types";

import { type ColumnDef } from "@tanstack/react-table";
import { Buildings, Document, User } from "iconsax-reactjs";

import { PartnerActions } from "./actions";

const Count = ({ icon, value }: { icon: React.ReactNode; value: number }) => (
	<div className="bg-secondary/40 text-secondary-foreground/60 border-secondary-3/20 flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium shadow-xs">
		{icon}
		{value}
	</div>
);

const columns: ColumnDef<PartnerWithRelations>[] = [
	{
		id: "company",
		accessorKey: "companyName",
		header: "Company",
		cell: ({ row }) => {
			const partner = row.original;
			return (
				<Link href={`/b2b/partners/${partner.id}`} className="group/link flex items-center gap-4">
					<div className="bg-primary/5 text-primary group-hover/link:bg-primary shadow-primary/10 group-hover/link:text-primary-foreground flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all group-hover/link:shadow-lg">
						<Buildings size={22} variant="Bulk" />
					</div>
					<div className="flex min-w-0 flex-col">
						<div className="text-foreground font-heading group-hover/link:text-primary font-bold transition-colors">{partner.companyName}</div>
						<div className="text-muted-foreground/80 line-clamp-1 text-xs">{partner.address || "No address provided"}</div>
					</div>
				</Link>
			);
		},
	},
	{
		id: "taxId",
		header: "ICE (Tax ID)",
		enableSorting: false,
		cell: ({ row }) =>
			row.original.taxId ? (
				<CopyableTaxId taxId={row.original.taxId} />
			) : (
				<span className="bg-secondary/20 border-secondary/30 text-secondary-foreground rounded border px-2 py-1 font-mono text-xs font-medium">
					N/A
				</span>
			),
	},
	{
		id: "contacts",
		header: "Contacts",
		accessorFn: (partner) => partner.contacts?.length || 0,
		cell: ({ getValue }) => (
			<Count icon={<User size={14} className="text-secondary-3" variant="Bold" />} value={getValue<number>()} />
		),
	},
	{
		id: "documents",
		header: "Documents",
		accessorFn: (partner) => partner.documents?.length || 0,
		cell: ({ getValue }) => (
			<Count icon={<Document size={14} className="text-secondary-3" variant="Bold" />} value={getValue<number>()} />
		),
	},
	{
		id: "actions",
		header: "",
		enableSorting: false,
		cell: ({ row }) => (
			<div className="flex justify-end">
				<PartnerActions partner={row.original} />
			</div>
		),
	},
];

export function PartnerTable({ partners }: { partners: PartnerWithRelations[] }) {
	return (
		<DataTable
			data={partners}
			columns={columns}
			noun={{ one: "partner", many: "partners" }}
			getRowHref={(partner) => `/b2b/partners/${partner.id}`}
			empty={
				<EmptyState
					icon={<Buildings size={40} variant="Bulk" />}
					title="No partners"
					description="Add your first partner company to manage their quotes and invoices."
				/>
			}
			renderCard={(partner) => (
				<div className="flex flex-col gap-3">
					<div className="flex items-start justify-between gap-2">
						<Link href={`/b2b/partners/${partner.id}`} className="flex min-w-0 items-center gap-3">
							<div className="bg-primary/5 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
								<Buildings size={22} variant="Bulk" />
							</div>
							<div className="min-w-0">
								<p className="text-foreground font-heading truncate font-bold">{partner.companyName}</p>
								<p className="text-muted-foreground/80 truncate text-xs">{partner.address || "No address provided"}</p>
							</div>
						</Link>
						<PartnerActions partner={partner} />
					</div>
					<div className="border-secondary/15 flex flex-wrap items-center gap-2 border-t pt-3">
						{partner.taxId ? <CopyableTaxId taxId={partner.taxId} /> : null}
						<Count icon={<User size={14} className="text-secondary-3" variant="Bold" />} value={partner.contacts?.length || 0} />
						<Count icon={<Document size={14} className="text-secondary-3" variant="Bold" />} value={partner.documents?.length || 0} />
					</div>
				</div>
			)}
		/>
	);
}
