"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
	DropdownMenu, 
	DropdownMenuContent, 
	DropdownMenuItem, 
	DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { type PartnerWithRelations } from "@/lib/types";

import { Buildings, Document, More, User } from "iconsax-reactjs";

export function PartnerGrid({ partners }: { partners: PartnerWithRelations[] }) {
	if (!partners.length) {
		return (
			<div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-secondary-foreground/10 bg-secondary/5 p-8 text-center transition-all hover:bg-secondary/10 text-secondary-foreground">
				<div className="mb-4 rounded-2xl bg-background p-4 shadow-sm">
					<Buildings className="h-10 w-10 text-primary/40" variant="Bulk" />
				</div>
				<h3 className="font-heading text-xl font-semibold text-foreground">No partners</h3>
				<p className="mt-1 max-w-xs text-muted-foreground">Start by adding your first B2B client to manage their quotes and invoices.</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
			{partners.map((partner) => (
				<Card
					key={partner.id}
					className="group relative overflow-hidden rounded-3xl border-secondary/20 transition-all duration-300 hover:zen-shadow-md"
				>
					<div className="absolute top-4 right-4 z-10">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-background/50 backdrop-blur-sm transition-all hover:bg-secondary">
									<More size={18} className="rotate-90" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48 rounded-xl border-secondary/20 shadow-xl">
								<DropdownMenuItem asChild className="cursor-pointer p-3 text-xs font-bold uppercase tracking-wide">
									<Link href={`/b2b/partners/${partner.id}`} className="flex items-center gap-2">
										<Buildings size={16} variant="Outline" />
										View Profile
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem className="cursor-pointer p-3 text-xs font-bold uppercase tracking-wide text-destructive">
									<div className="flex items-center gap-2">
										<More size={16} className="rotate-90" />
										Delete
									</div>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<CardContent className="flex flex-col p-6">
						<Link href={`/b2b/partners/${partner.id}`} className="group/link">
							<div className="mb-4 flex items-center gap-4">
								<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary shadow-primary/10 transition-all group-hover/link:bg-primary group-hover/link:text-primary-foreground group-hover/link:shadow-lg">
									<Buildings size={28} variant="Bulk" />
								</div>
								<div className="flex flex-col">
									<h3 className="font-heading text-xl font-bold text-foreground transition-colors group-hover/link:text-primary">
										{partner.companyName}
									</h3>
									<p className="line-clamp-1 text-xs text-muted-foreground/80">
										{partner.address || "No address provided"}
									</p>
								</div>
							</div>
						</Link>

						<div className="mb-6 grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-1 rounded-2xl bg-secondary/10 p-3">
								<div className="flex items-center gap-1.5 text-muted-foreground">
									<User size={14} variant="Bulk" />
									<span className="text-[10px] font-bold uppercase tracking-wider">Contacts</span>
								</div>
								<span className="text-lg font-bold text-foreground">
									{partner.contacts?.length || 0}
								</span>
							</div>
							<div className="flex flex-col gap-1 rounded-2xl bg-secondary/10 p-3">
								<div className="flex items-center gap-1.5 text-muted-foreground">
									<Document size={14} variant="Bulk" />
									<span className="text-[10px] font-bold uppercase tracking-wider">Documents</span>
								</div>
								<span className="text-lg font-bold text-foreground">
									{partner.documents?.length || 0}
								</span>
							</div>
						</div>

						{partner.taxId ? (
							<div className="flex items-center justify-between rounded-xl border border-secondary/10 bg-secondary/5 px-3 py-2">
								<span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Tax ID / ICE</span>
								<span className="font-mono text-xs font-bold leading-none text-foreground">{partner.taxId}</span>
							</div>
						) : null}
					</CardContent>
				</Card>
			))}
		</div>
	);
}
