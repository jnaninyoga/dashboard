"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type PartnerWithRelations } from "@/lib/types";

import { Buildings, Document, More, User } from "iconsax-reactjs";
import { CopyableTaxId } from "./copyable-tax-id";

export function PartnerGrid({
	partners,
}: {
	partners: PartnerWithRelations[];
}) {
	if (!partners.length) {
		return (
			<div className="flex h-64 flex-col gap-2 items-center justify-center rounded-2xl border-2 border-dashed border-secondary-foreground/10 bg-sidebar p-8 text-center text-secondary-foreground">
				<Buildings className="size-16 text-primary/40" variant="Bulk" />
				<h3 className="font-heading text-xl font-semibold text-foreground">
					No partners
				</h3>
				<p className="mt-1 max-w-xs text-muted-foreground">
					Start by adding your first B2B client to manage their quotes and
					invoices.
				</p>
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
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 rounded-xl bg-background/50 backdrop-blur-sm transition-all hover:bg-secondary"
								>
									<More size={18} className="rotate-90" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-48 rounded-xl border-secondary/20 shadow-xl"
							>
								<DropdownMenuItem
									asChild
									className="cursor-pointer p-3 text-xs font-bold uppercase tracking-wide"
								>
									<Link
										href={`/b2b/partners/${partner.id}`}
										className="flex items-center gap-2"
									>
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

					<CardContent className="relative p-0">
						<div className="text-primary absolute rotate-6 group-hover:rotate-0 -bottom-14 group-hover:-bottom-12 -right-7 group-hover:-right-5 opacity-5 transition-all duration-300 group-hover:opacity-10">
							<Buildings size={230} variant="Bulk" />
						</div>
						<div className="relative w-full h-full flex flex-col p-6 z-10">
							<Link href={`/b2b/partners/${partner.id}`} className="group/link">
								<div className="mb-4 flex items-center gap-4">
									<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary shadow-primary/10 transition-all group-hover/link:bg-primary/10 group-hover/link:text-primary group-hover/link:shadow-lg">
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
								<div className="group bg-secondary/40 flex flex-col gap-1 rounded-2xl border p-3 transition-all hover:bg-secondary/60 hover:border-secondary-3/20">
									<div className="flex items-center gap-2">
										<User className="text-secondary-3 h-4 w-4" variant="Bold" />
										<span className="text-secondary-foreground text-[10px] font-bold tracking-wider uppercase opacity-60">
											Contacts
										</span>
									</div>
									<span className="text-sm font-semibold capitalize">
										{partner.contacts?.length || 0}
									</span>
								</div>

								<div className="group bg-secondary/40 flex flex-col gap-1 rounded-2xl border p-3 transition-all hover:bg-secondary/60 hover:border-secondary-3/20">
									<div className="flex items-center gap-2">
										<Document
											className="text-secondary-3 h-4 w-4"
											variant="Bold"
										/>
										<span className="text-secondary-foreground text-[10px] font-bold tracking-wider uppercase opacity-60">
											Documents
										</span>
									</div>
									<span className="text-sm font-semibold capitalize">
										{partner.documents?.length || 0}
									</span>
								</div>
							</div>

							{partner.taxId ? (
								<CopyableTaxId taxId={partner.taxId} className="w-full" />
							) : null}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
