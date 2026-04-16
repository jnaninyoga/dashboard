"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
	convertQuoteToInvoiceAction,
	updateDocumentStatusAction,
} from "@/actions/b2b/documents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BusinessProfile, DocumentWithRelations } from "@/lib/types/b2b";
import { type B2BDocument, type B2BDocumentStatus } from "@/lib/types/b2b";

import {
	ArrowRight,
	CloseCircle,
	Convert,
	Link1,
	MoneySend,
	Send,
	TickCircle,
} from "iconsax-reactjs";
import { toast } from "sonner";

import { PDFDownloadBtn } from "./download-btn";

export function DocumentActionRibbon({ doc, profile }: { doc: DocumentWithRelations, profile: BusinessProfile | null }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const handleStatusUpdate = (status: B2BDocumentStatus) => {
		startTransition(async () => {
			const res = await updateDocumentStatusAction(
				doc.id,
				status,
				doc.partnerId,
			);
			if (res.success) {
				toast.success(`Document marked as ${status}`);
				router.refresh();
			} else {
				toast.error(res.error || "Failed to update document");
			}
		});
	};

	const handleConvert = () => {
		startTransition(async () => {
			const res = await convertQuoteToInvoiceAction(doc.id);
			if (res.success && res.id) {
				toast.success("Invoice generated successfully!");
				router.push(`/b2b/documents/${res.id}`);
			} else {
				toast.error(res.error || "Failed to convert quote");
			}
		});
	};

	const isQuote = doc.type === "quote";
	const isInvoice = doc.type === "invoice";

	return (
		<div className="animate-slide-up border-foreground/10 bg-card flex flex-wrap items-center gap-4 rounded-2xl border p-4 shadow-sm backdrop-blur-sm transition-all delay-100 duration-300">
			{/* Linked Documents / Relations (Left Side) */}
			{doc.parent || doc.children?.length ? (
				<div className="lg:border-foreground/5 flex flex-wrap items-center gap-4 lg:mr-2 lg:border-r lg:pr-5">
					<div className="bg-primary/15 text-primary border-primary/20 zen-teal-glow flex size-9 shrink-0 items-center justify-center rounded-full border">
						<Link1 size={18} variant="Bulk" />
					</div>
					<div className="flex flex-wrap gap-x-5 gap-y-2">
						{doc.parent ? (
							<div className="flex flex-col">
								<span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-50">
									Source Quote
								</span>
								<Link href={`/b2b/documents/${doc.parent.id}`}>
									<Badge
										variant="outline"
										className="text-primary border-primary/30 hover:bg-primary hover:text-primary-foreground h-5 border px-1.5 text-[9px] font-bold tracking-widest uppercase transition-all duration-200"
									>
										{doc.parent.documentNumber}
									</Badge>
								</Link>
							</div>
						) : null}
						{doc.children?.length
							? (doc.children as B2BDocument[]).map((child) => (
									<div key={child.id} className="flex flex-col">
										<span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-50">
											Generated Invoice
										</span>
										<Link href={`/b2b/documents/${child.id}`}>
											<Badge
												variant="outline"
												className="text-primary border-primary/30 hover:bg-primary hover:text-primary-foreground h-5 border px-1.5 text-[9px] font-bold tracking-widest uppercase transition-all duration-200"
											>
												{child.documentNumber}
											</Badge>
										</Link>
									</div>
								))
							: null}
					</div>
				</div>
			) : null}

			<div className="flex-1" />

			{/* Actions (Right Side - Stable CTA) */}
			<div className="flex flex-wrap items-center gap-3">
                <PDFDownloadBtn doc={doc} profile={profile} />

				{/* Draft -> Sent */}
				{doc.status === "draft" ? (
					<Button
						onClick={() => handleStatusUpdate("sent")}
						disabled={isPending}
						className="zen-glow-teal gap-2 rounded-xl font-bold"
					>
						<Send size={18} variant="Bold" />
						Mark as Sent
					</Button>
				) : null}

				{/* Quote Specific: Sent -> Accepted */}
				{isQuote && doc.status === "sent" ? (
					<Button
						onClick={() => handleStatusUpdate("accepted")}
						disabled={isPending}
						className="gap-2 rounded-xl bg-green-600 font-bold text-white shadow-sm hover:bg-green-700"
					>
						<TickCircle size={18} variant="Bold" />
						Accept Quote
					</Button>
				) : null}

				{/* Quote Specific: Accepted -> Convert to Invoice */}
				{isQuote && doc.status === "accepted" && doc.children?.length === 0 ? (
					<Button
						onClick={handleConvert}
						disabled={isPending}
						className="bg-primary hover:bg-primary/90 font-heading gap-2 rounded-xl font-bold shadow-md"
					>
						<Convert size={18} variant="Bold" />
						Convert to Invoice
						<ArrowRight size={16} />
					</Button>
				) : null}

				{/* Invoice Specific: Sent -> Paid */}
				{isInvoice && doc.status === "sent" ? (
					<Button
						onClick={() => handleStatusUpdate("paid")}
						disabled={isPending}
						className="gap-2 rounded-xl bg-green-600 font-bold text-white shadow-sm hover:bg-green-700"
					>
						<MoneySend size={18} variant="Bold" />
						Mark as Paid
					</Button>
				) : null}

				{/* Invoice Specific: Paid -> Unpaid (Sent) */}
				{isInvoice && doc.status === "paid" ? (
					<Button
						onClick={() => handleStatusUpdate("sent")}
						disabled={isPending}
						variant="outline"
						className="border-destructive/20 text-destructive hover:bg-destructive/5 gap-2 rounded-xl font-bold"
					>
						<CloseCircle size={18} variant="Outline" />
						Mark as Unpaid
					</Button>
				) : null}

				{/* Cancel Action */}
				{doc.status !== "cancelled" && doc.status !== "paid" ? (
					<Button
						onClick={() => handleStatusUpdate("cancelled")}
						disabled={isPending}
						variant="ghost"
						className="text-muted-foreground hover:bg-destructive/5 hover:text-destructive gap-2 rounded-xl font-medium"
					>
						<CloseCircle size={18} />
						Cancel Document
					</Button>
				) : null}
			</div>
		</div>
	);
}
