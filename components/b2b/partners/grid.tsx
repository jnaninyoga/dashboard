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

import { CopyableTaxId } from "../copyable-tax-id";

export function PartnerGrid({
	partners,
}: {
	partners: PartnerWithRelations[];
}) {
	if (!partners.length) {
		return (
			<div className="border-secondary-foreground/10 bg-sidebar text-secondary-foreground flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center">
				<Buildings className="text-primary/40 size-16" variant="Bulk" />
				<h3 className="font-heading text-foreground text-xl font-semibold">
					No partners
				</h3>
				<p className="text-muted-foreground mt-1 max-w-xs">
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
					className="group border-secondary/20 hover:zen-shadow-md relative overflow-hidden rounded-3xl transition-all duration-300"
				>
					<div className="absolute top-4 right-4 z-10">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="bg-background/50 hover:bg-secondary h-8 w-8 rounded-xl backdrop-blur-sm transition-all"
								>
									<More size={18} className="rotate-90" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="border-secondary/20 w-48 rounded-xl shadow-xl"
							>
								<DropdownMenuItem
									asChild
									className="cursor-pointer p-3 text-xs font-bold tracking-wide uppercase"
								>
									<Link
										href={`/b2b/partners/${partner.id}`}
										className="flex items-center gap-2"
									>
										<Buildings size={16} variant="Outline" />
										View Profile
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem className="text-destructive cursor-pointer p-3 text-xs font-bold tracking-wide uppercase">
									<div className="flex items-center gap-2">
										<More size={16} className="rotate-90" />
										Delete
									</div>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<CardContent className="relative p-0">
						<div className="text-primary absolute -right-7 -bottom-14 rotate-6 opacity-5 transition-all duration-300 group-hover:-right-5 group-hover:-bottom-12 group-hover:rotate-0 group-hover:opacity-10">
							<Buildings size={230} variant="Bulk" />
						</div>
						<div className="relative z-10 flex h-full w-full flex-col p-6">
							<Link href={`/b2b/partners/${partner.id}`} className="group/link">
								<div className="mb-4 flex items-center gap-4">
									<div className="bg-primary/5 text-primary shadow-primary/10 group-hover/link:bg-primary/10 group-hover/link:text-primary flex h-14 w-14 items-center justify-center rounded-2xl transition-all group-hover/link:shadow-lg">
										<Buildings size={28} variant="Bulk" />
									</div>
									<div className="flex flex-col">
										<h3 className="font-heading text-foreground group-hover/link:text-primary text-xl font-bold transition-colors">
											{partner.companyName}
										</h3>
										<p className="text-muted-foreground/80 line-clamp-1 text-xs">
											{partner.address || "No address provided"}
										</p>
									</div>
								</div>
							</Link>

							<div className="mb-6 grid grid-cols-2 gap-3">
								<div className="group bg-primary/15 border-primary/20 flex flex-col gap-1 rounded-2xl border p-3 transition-all">
									<div className="flex items-center gap-2">
										<User className="text-primary h-4 w-4" variant="Bold" />
										<span className="text-primary text-[10px] font-bold tracking-wider uppercase opacity-60">
											Contacts
										</span>
									</div>
									<span className="text-sm font-semibold capitalize">
										{partner.contacts?.length || 0}
									</span>
								</div>

								<div className="group bg-primary/15 border-primary/20 flex flex-col gap-1 rounded-2xl border p-3 transition-all">
									<div className="flex items-center gap-2">
										<Document
											className="text-primary h-4 w-4"
											variant="Bold"
										/>
										<span className="text-primary text-[10px] font-bold tracking-wider uppercase opacity-60">
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
