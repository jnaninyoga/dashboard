"use client";

import Link from "next/link";

import { type DocumentWithContact } from "@/lib/types";

import { format } from "date-fns";
import { ArrowRight2, ReceiptText } from "iconsax-reactjs";

import { DocumentStatusBadge } from "./status-badge";

// The whole card opens the document; its actions (PDF, payment, archive)
// live on the detail page.
export function DocumentCard({ doc }: { doc: DocumentWithContact }) {
	return (
		<Link
			href={`/b2b/documents/${doc.id}`}
			className="group border-secondary/10 bg-card hover:zen-shadow-md focus-visible:ring-ring relative flex flex-col gap-4 overflow-hidden rounded-3xl border p-5 transition-all duration-300 focus-visible:ring-2 focus-visible:outline-none"
		>
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

				<ArrowRight2
					size={18}
					className="text-muted-foreground mt-3 transition-transform group-hover:translate-x-0.5"
				/>
			</div>

			<div className="flex flex-col gap-1 px-1">
				<span className="text-muted-foreground/80 text-xs font-medium">To: {doc.contact?.fullName || "No contact"}</span>
				<div className="mt-1">
					<DocumentStatusBadge status={doc.status} />
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
		</Link>
	);
}
