"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
	DropdownMenu, 
	DropdownMenuContent, 
	DropdownMenuItem, 
	DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { type DocumentWithContact } from "@/lib/types";

import { format } from "date-fns";
import { 
	ArchiveBook,
	Clock,
	CloseCircle,
	DocumentDownload,
	Edit2,
	More,
	ReceiptText,
	TickCircle,
} from "iconsax-reactjs";

export function DocumentCard({ doc }: { doc: DocumentWithContact }) {
	const getStatusProps = (status: string) => {
		const s = status.toLowerCase();
		switch (s) {
			case "paid":
				return { variant: "success" as const, icon: <TickCircle size={14} variant="Bold" />, label: "Paid" };
			case "accepted":
				return { variant: "success" as const, icon: <ReceiptText size={14} variant="Bold" />, label: "Accepted" };
			case "sent":
				return { variant: "info" as const, icon: <Clock size={14} variant="Bold" />, label: "Sent" };
			case "cancelled":
				return { variant: "destructive" as const, icon: <CloseCircle size={14} variant="Bold" />, label: "Cancelled" };
			case "draft":
			default:
				return { variant: "muted" as const, icon: <Edit2 size={14} variant="Bold" />, label: "Draft" };
		}
	};

	const statusProps = getStatusProps(doc.status);

	return (
		<div className="group border-secondary/10 bg-card hover:zen-shadow-md relative flex flex-col gap-4 overflow-hidden rounded-3xl border p-5 transition-all duration-300">
			<div className="flex items-start justify-between">
				<div className="flex items-center gap-3">
					<div className="bg-primary/5 text-primary group-hover:bg-primary shadow-primary/10 group-hover:text-primary-foreground flex h-11 w-11 items-center justify-center rounded-2xl transition-all group-hover:shadow-lg">
						<ReceiptText size={22} variant="Bulk" />
					</div>
					<div className="flex flex-col">
						<span className="text-foreground text-sm font-black tracking-tight">{doc.documentNumber}</span>
						<span className="text-muted-foreground/60 text-[10px] font-bold tracking-widest uppercase">
							{doc.type}
						</span>
					</div>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="hover:bg-secondary h-8 w-8 rounded-xl transition-all">
							<More size={18} className="rotate-90" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="border-secondary/10 w-48 rounded-2xl shadow-xl">
						<DropdownMenuItem className="cursor-pointer gap-2 p-3 text-[10px] font-bold tracking-widest uppercase">
							<ReceiptText size={16} variant="Bulk" /> View Details
						</DropdownMenuItem>
						<DropdownMenuItem className="cursor-pointer gap-2 p-3 text-[10px] font-bold tracking-widest uppercase">
							<DocumentDownload size={16} variant="Bulk" /> Download PDF
						</DropdownMenuItem>
						<DropdownMenuItem className="cursor-pointer gap-2 p-3 text-[10px] font-bold tracking-widest uppercase">
							<ArchiveBook size={16} variant="Bulk" /> Archive
						</DropdownMenuItem>
						<DropdownMenuItem
							variant="destructive"
							className="cursor-pointer gap-2 p-3 text-[10px] font-bold tracking-widest uppercase"
						>
							<CloseCircle size={16} variant="Bulk" /> Cancel
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="flex flex-col gap-1 px-1">
				<span className="text-muted-foreground/80 text-xs font-medium">To: {doc.contact?.fullName || "No contact"}</span>
				<div className="mt-1">
					<Badge 
						variant={statusProps.variant} 
						className="flex w-fit items-center gap-1.5 px-3 py-1 text-[10px] font-bold tracking-widest uppercase transition-all"
					>
						{statusProps.icon}
						{statusProps.label}
					</Badge>
				</div>
			</div>

			<div className="bg-secondary/20 mt-2 h-px w-full shrink-0" />

			<div className="flex items-center justify-between px-1">
				<div className="flex flex-col">
					<span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-40">Amount</span>
					<span className="text-foreground text-base font-black">
						{parseFloat(doc.totalAmount).toLocaleString("en-US", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}{" "}
						MAD
					</span>
				</div>
				<div className="text-right">
					<span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-40">Issued On</span>
					<div className="text-foreground text-[11px] font-bold">
						{doc.issueDate ? format(new Date(doc.issueDate), "MMM dd, yyyy") : "N/A"}
					</div>
				</div>
			</div>
		</div>
	);
}
