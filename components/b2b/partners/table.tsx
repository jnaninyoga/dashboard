"use client";

import Link from "next/link";

import { CopyableTaxId } from "@/components/b2b/copyable-tax-id";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { type PartnerWithRelations } from "@/lib/types";

import { Buildings, Document, User } from "iconsax-reactjs";

import { PartnerActions } from "./actions";

export function PartnerTable({ partners }: { partners: PartnerWithRelations[] }) {
	if (!partners.length) {
		return (
			<div className="border-secondary/10 bg-secondary/5 hover:bg-secondary/10 text-secondary-foreground flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all">
				<div className="bg-background mb-4 rounded-2xl p-4 shadow-sm">
                    <Buildings className="text-primary/40 h-10 w-10" variant="Bulk" />
                </div>
				<h3 className="text-foreground font-heading text-xl font-semibold">No partners</h3>
				<p className="text-muted-foreground mt-1 max-w-xs">Start by adding your first B2B client to manage their quotes and invoices.</p>
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow className="border-b transition-colors hover:bg-transparent">
					<TableHead className="py-4">Company</TableHead>
					<TableHead>ICE (Tax ID)</TableHead>
					<TableHead>Contacts</TableHead>
					<TableHead>Documents</TableHead>
					<TableHead className="w-12"></TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{partners.map((partner) => (
					<TableRow key={partner.id} className="border-secondary/10 hover:bg-primary/5 transition-all">
						<TableCell className="py-4">
							<Link href={`/b2b/partners/${partner.id}`} className="group flex items-center gap-4">
								<div className="bg-primary/5 text-primary group-hover:bg-primary shadow-primary/10 group-hover:text-primary-foreground flex h-11 w-11 items-center justify-center rounded-xl transition-all group-hover:shadow-lg">
									<Buildings size={22} variant="Bulk" />
								</div>
								<div className="flex flex-col">
									<div className="text-foreground font-heading group-hover:text-primary font-bold transition-colors">{partner.companyName}</div>
									<div className="text-muted-foreground/80 line-clamp-1 text-xs">{partner.address || "No address provided"}</div>
								</div>
							</Link>
						</TableCell>
						<TableCell>
							{partner.taxId ? (
								<CopyableTaxId taxId={partner.taxId} />
							) : (
								<span className="bg-secondary/20 border-secondary/30 text-secondary-foreground rounded border px-2 py-1 font-mono text-xs font-medium">
									N/A
								</span>
							)}
						</TableCell>
						<TableCell>
							<div className="bg-secondary/40 text-secondary-foreground/60 border-secondary-3/20 flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium shadow-xs transition-colors">
								<User size={14} className="text-secondary-3" variant="Bold" />
								{partner.contacts?.length || 0}
							</div>
						</TableCell>
						<TableCell>
							<div className="bg-secondary/40 text-secondary-foreground/60 border-secondary-3/20 flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium shadow-xs transition-colors">
								<Document size={14} className="text-secondary-3" variant="Bold" />
								{partner.documents?.length || 0}
							</div>
						</TableCell>
						<TableCell>
							<PartnerActions partner={partner} />
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
