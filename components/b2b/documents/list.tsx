"use client";

import Link from "next/link";

import { DocumentCard } from "@/components/b2b/documents/card";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { type DocumentWithContact } from "@/lib/types";

import { format } from "date-fns";
import {
	ArchiveBook,
	CloseCircle,
	DocumentDownload,
	DocumentText,
	More,
	ReceiptText,
} from "iconsax-reactjs";

import DocumentNotFound from "./not-found";
import { DocumentStatusBadge } from "./status-badge";

interface DocumentListProps {
	documents: DocumentWithContact[];
	partnerId: string;
}

export function DocumentList({ documents }: DocumentListProps) {
	if (!documents.length) return <DocumentNotFound 
		message="Quotes and invoices for this partner will appear here once generated." 
	/>;

	return (
		<div className="space-y-4">
			{/* Mobile Card View */}
			<div className="grid grid-cols-1 gap-4 md:hidden">
				{documents.map((doc) => (
					<DocumentCard key={doc.id} doc={doc} />
				))}
			</div>

			{/* Desktop Table View */}
			<div className="hidden md:block">
				<Table containerClassName="overflow-x-hidden">
					<TableHeader>
						<TableRow className="border-b transition-colors hover:bg-transparent">
							<TableHead className="pl-6">Type</TableHead>
							<TableHead className="px-6">Document</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Issued</TableHead>
							<TableHead>Amount</TableHead>
							<TableHead className="pr-6 text-right" />
						</TableRow>
					</TableHeader>
					<TableBody className="divide-secondary/15 divide-y">
						{documents.map((doc) => (
							<TableRow
								key={doc.id}
								className="hover:bg-primary/5 group border-none transition-colors"
							>
								<TableCell className="px-4 py-3 pl-6">
									<span className="text-[10px] font-bold tracking-wider uppercase opacity-40">
										{doc.type}
									</span>
								</TableCell>
								<TableCell className="px-4 py-3">
									<Link
										href={`/b2b/documents/${doc.id}`}
										className="flex items-center gap-3"
									>
										<div className="bg-secondary/40 text-secondary-3 group-hover:bg-primary/10 group-hover:text-primary group-hover:zen-glow-teal flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-all group-hover:scale-110">
											{doc.type === "invoice" ? (
												<ReceiptText size={20} variant="Bulk" />
											) : (
												<DocumentText size={20} variant="Bulk" />
											)}
										</div>
										<div className="flex flex-col">
											<span className="text-foreground text-sm font-bold tracking-tight">
												{doc.documentNumber}
											</span>
											<span className="text-muted-foreground/60 text-[10px] leading-none font-medium">
												{doc.contact?.fullName || "No contact linked"}
											</span>
										</div>
									</Link>
								</TableCell>
								<TableCell className="px-4 py-3">
									<DocumentStatusBadge status={doc.status} />
								</TableCell>
								<TableCell className="text-muted-foreground px-4 py-3 text-[10px] font-bold tracking-widest uppercase opacity-70">
									{doc.issueDate
										? format(new Date(doc.issueDate), "MMM dd, yyyy")
										: "N/A"}
								</TableCell>
								<TableCell className="text-primary px-4 py-3 text-sm font-black tabular-nums">
									{parseFloat(doc.totalAmount).toLocaleString("en-US", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}{" "}
									MAD
								</TableCell>
								<TableCell className="px-4 py-3 pr-6 text-right">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="hover:bg-secondary/20 h-9 w-9 rounded-xl transition-colors"
											>
												<More
													size={18}
													className="text-muted-foreground rotate-90"
												/>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											align="end"
											className="border-secondary/10 w-48 rounded-2xl border shadow-2xl"
										>
											<DropdownMenuItem className="cursor-pointer gap-2 p-3 text-[10px] font-bold tracking-widest uppercase">
												<ReceiptText className="size-5" variant="Bulk" /> View
												Details
											</DropdownMenuItem>
											<DropdownMenuItem className="cursor-pointer gap-2 p-3 text-[10px] font-bold tracking-widest uppercase">
												<DocumentDownload className="size-5" variant="Bulk" />{" "}
												Download PDF
											</DropdownMenuItem>
											<DropdownMenuItem className="cursor-pointer gap-2 p-3 text-[10px] font-bold tracking-widest uppercase">
												<ArchiveBook className="size-5" variant="Bulk" />{" "}
												Archive
											</DropdownMenuItem>
											<DropdownMenuItem
												variant="destructive"
												className="cursor-pointer gap-2 p-3 text-[10px] font-bold tracking-widest uppercase"
											>
												<CloseCircle className="size-5" variant="Bulk" /> Cancel
												Document
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
