"use client";

import Link from "next/link";
import { DocumentCard } from "@/components/b2b/document-card";
import { DocumentDialog } from "@/components/b2b/document-dialog";
import { Badge } from "@/components/ui/badge";
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
import { type B2BContact, type DocumentWithContact } from "@/lib/types";

import { format } from "date-fns";
import {
	ArchiveBook,
	Clock,
	CloseCircle,
	DocumentDownload,
	DocumentText as DocumentIcon,
	DocumentText,
	Edit2,
	More,
	ReceiptText,
	TickCircle,
} from "iconsax-reactjs";

interface DocumentListProps {
	documents: DocumentWithContact[];
	partnerId: string;
	contacts: B2BContact[];
}

export function DocumentList({
	documents,
	partnerId,
	contacts,
}: DocumentListProps) {
	const getStatusProps = (status: string) => {
		const s = status.toLowerCase();
		switch (s) {
			case "paid":
				return {
					variant: "success" as const,
					icon: <TickCircle size={14} variant="Bold" />,
					label: "Paid",
				};
			case "accepted":
				return {
					variant: "success" as const,
					icon: <ReceiptText size={14} variant="Bold" />,
					label: "Accepted",
				};
			case "sent":
				return {
					variant: "info" as const,
					icon: <Clock size={14} variant="Bold" />,
					label: "Sent",
				};
			case "cancelled":
				return {
					variant: "destructive" as const,
					icon: <CloseCircle size={14} variant="Bold" />,
					label: "Cancelled",
				};
			case "draft":
			default:
				return {
					variant: "muted" as const,
					icon: <Edit2 size={14} variant="Bold" />,
					label: "Draft",
				};
		}
	};

	if (!documents.length) {
		return (
			<div className="group border-secondary/10 bg-secondary/5 hover:bg-secondary/10 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-20 text-center transition-all">
				<div className="border-secondary/5 bg-background mb-4 rounded-2xl border p-6 shadow-sm transition-transform group-hover:scale-110">
					<DocumentIcon
						className="text-primary/30 h-10 w-10"
						variant="Outline"
					/>
				</div>
				<h3 className="font-heading text-foreground text-xl font-bold">
					No documents
				</h3>
				<p className="text-muted-foreground mt-2 max-w-sm text-sm">
					Quotes and invoices for this partner will appear here once generated.
				</p>
				<DocumentDialog partnerId={partnerId} contacts={contacts}>
					<Button
						variant="outline"
						className="border-primary/20 text-primary hover:bg-primary/5 mt-6 rounded-xl font-bold transition-all active:scale-95"
					>
						Generate first document
					</Button>
				</DocumentDialog>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Mobile Card View */}
			<div className="grid grid-cols-1 gap-4 md:hidden">
				{documents.map((doc) => (
					<DocumentCard key={doc.id} doc={doc} />
				))}
			</div>

			{/* Desktop Table View */}
			<div className="border-foreground/10 shadow-secondary/5 hidden overflow-hidden rounded-3xl border shadow-sm md:block">
				<Table containerClassName="overflow-x-hidden" className="bg-card">
					<TableHeader className="bg-sidebar border-b border-foreground/10">
						<TableRow className="border-foreground/10 border-b hover:bg-transparent">
							<TableHead className="text-muted-foreground h-10 px-4 pl-6 text-[10px] font-bold tracking-widest uppercase">
								Type
							</TableHead>
							<TableHead className="text-muted-foreground h-10 px-6 text-[10px] font-bold tracking-widest uppercase">
								Document
							</TableHead>
							<TableHead className="text-muted-foreground h-10 px-4 text-[10px] font-bold tracking-widest uppercase">
								Status
							</TableHead>
							<TableHead className="text-muted-foreground h-10 px-4 text-[10px] font-bold tracking-widest uppercase">
								Issued
							</TableHead>
							<TableHead className="text-muted-foreground h-10 px-4 text-[10px] font-bold tracking-widest uppercase">
								Amount
							</TableHead>
							<TableHead className="h-10 pr-6 text-right" />
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
										<div className="bg-secondary/40 text-secondary-3 group-hover:bg-primary/10 group-hover:text-primary flex h-10 w-10 items-center justify-center rounded-xl transition-all group-hover:scale-110 group-hover:zen-glow-teal shadow-sm">
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
									<Badge
										variant={getStatusProps(doc.status).variant}
										className="flex w-fit items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase transition-all"
									>
										{getStatusProps(doc.status).icon}
										{getStatusProps(doc.status).label}
									</Badge>
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
													className="rotate-90 text-muted-foreground"
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
