"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { documentAmounts, isPayableInvoice, orderPaymentQueue } from "@/lib/domain/billing/payments";
import { type DocumentWithRelations } from "@/lib/types/b2b";
import { cn } from "@/lib/utils/ui";

import { MoneySend } from "iconsax-reactjs";

import { RecordPaymentDialog } from "./record-payment-dialog";

/**
 * "Record payment" and its dialog, wherever the page asks for money: the
 * actions at the top, the end of the payments story. The invoice she's on
 * is paid first, then the other open invoices of its quotation (the same
 * order as the server).
 */
export function RecordPaymentButton({
	doc,
	siblings = [],
	className,
}: {
	doc: DocumentWithRelations;
	/** The other invoices of its quotation. */
	siblings?: DocumentWithRelations[];
	className?: string;
}) {
	const [open, setOpen] = useState(false);
	if (!isPayableInvoice(doc)) return null;

	const queue = orderPaymentQueue(
		doc.id,
		[doc, ...siblings.filter((inv) => inv.id !== doc.id)].filter(isPayableInvoice).map((inv) => ({
			id: inv.id,
			documentNumber: inv.documentNumber ?? "",
			totalAmount: Number(inv.totalAmount),
			amountPaid: documentAmounts(inv).paid,
		})),
	);

	return (
		<>
			<Button
				onClick={() => setOpen(true)}
				className={cn("bg-success text-success-foreground hover:bg-success/90 gap-2 rounded-xl font-bold shadow-sm", className)}
			>
				<MoneySend size={18} variant="Bold" />
				Record payment
			</Button>
			<RecordPaymentDialog doc={doc} queue={queue} open={open} onOpenChange={setOpen} />
		</>
	);
}
