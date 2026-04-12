"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { DocumentWithRelations } from "@/lib/types/b2b";

import { format } from "date-fns";
import {
	Clock,
	CloseCircle,
	DocumentText,
	Edit2,
	More,
	ReceiptText,
	TickCircle,
} from "iconsax-reactjs";

interface DocumentDashboardTableProps {
	documents: DocumentWithRelations[];
}

export function DocumentDashboardTable({
	documents,
}: DocumentDashboardTableProps) {
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

	return (
		<div className="border-foreground/10 shadow-secondary/5 hidden overflow-hidden rounded-3xl border shadow-sm md:block">
			<Table containerClassName="overflow-x-hidden" className="bg-white">
				<TableHeader className="bg-sidebar border-b border-foreground/10">
					<TableRow className="border-foreground/10 border-b hover:bg-transparent">
						<TableHead className="text-muted-foreground/70 h-10 pl-6 text-[10px] font-bold tracking-widest uppercase">
							Type
						</TableHead>
						<TableHead className="text-muted-foreground/70 h-10 px-6 text-[10px] font-bold tracking-widest uppercase">
							Document
						</TableHead>
						<TableHead className="text-muted-foreground/70 h-10 text-[10px] font-bold tracking-widest uppercase">
							Partner
						</TableHead>
						<TableHead className="text-muted-foreground/70 h-10 text-[10px] font-bold tracking-widest uppercase">
							Status
						</TableHead>
						<TableHead className="text-muted-foreground/70 h-10 text-right text-[10px] font-bold tracking-widest uppercase">
							Amount
						</TableHead>
						<TableHead className="h-10 pr-6 text-right"></TableHead>
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
									<div className="bg-secondary/40 text-secondary-3 group-hover:bg-primary/10 group-hover:text-primary flex h-10 w-10 items-center justify-center rounded-xl transition-all group-hover:scale-110 group-hover:zen-glow-teal">
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
											{format(new Date(doc.issueDate), "MMM dd, yyyy")}
										</span>
									</div>
								</Link>
							</TableCell>
							<TableCell className="px-4 py-3">
								<Link
									href={`/b2b/partners/${doc.partnerId}`}
									className="group/partner flex flex-col"
								>
									<span className="text-foreground group-hover/partner:text-primary text-sm font-bold transition-colors">
										{doc.partner?.companyName}
									</span>
									<span className="text-muted-foreground/60 text-[10px] leading-none font-medium">
										{doc.contact?.fullName || "No contact linked"}
									</span>
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
							<TableCell className="text-primary px-4 py-3 text-sm font-black text-right tabular-nums">
								{parseFloat(doc.totalAmount).toLocaleString("en-US", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}{" "}
								MAD
							</TableCell>
							<TableCell className="px-4 py-3 pr-6 text-right">
								<Link href={`/b2b/documents/${doc.id}`}>
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
								</Link>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
