"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import {
	convertQuoteToInvoiceAction,
	updateDocumentStatusAction,
} from "@/actions/b2b/documents";
import { Button } from "@/components/ui/button";
import { B2BDocumentStatus, DocumentWithRelations } from "@/lib/types/b2b";

import {
	ArrowRight,
	CloseCircle,
	Convert,
	MoneySend,
	Send,
	TickCircle,
} from "iconsax-reactjs";
import { toast } from "sonner";

export function DocumentActionRibbon({ doc }: { doc: DocumentWithRelations }) {
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
		<div className="border-foreground/10 bg-card flex flex-wrap items-center gap-3 rounded-2xl border p-4 backdrop-blur-sm">
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

			<div className="flex-1" />

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
	);
}
