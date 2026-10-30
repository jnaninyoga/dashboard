"use client";

import { useState,useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useFlushDraft } from "@/components/b2b/documents/draft-save";
import { useNotice } from "@/components/b2b/documents/notices";
import { useConfirm } from "@/components/feedback/confirm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	archiveDocumentAction,
	deleteDocumentAction,
	updateDocumentStatusAction,
} from "@/lib/actions/b2b/documents";
import { documentName } from "@/lib/domain/billing/document-name";
import { isPayableInvoice, orderPaymentQueue } from "@/lib/domain/billing/payments";
import { quoteBalance } from "@/lib/domain/billing/quote-billing";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import type { BusinessProfile, DocumentWithRelations } from "@/lib/types/b2b";
import { type B2BDocumentStatus } from "@/lib/types/b2b";

import {
	Archive,
	MoneySend,
	ReceiptAdd,
	Send,
	TickCircle,
	Trash,
} from "iconsax-reactjs";

import { ArchiveDocumentDialog } from "./archive-dialog";
import { PDFDownloadBtn } from "./download-btn";
import { InvoicePortionSheet } from "./invoice-portion-sheet";
import {
	type PaymentQueueEntry,
	RecordPaymentDialog,
} from "./record-payment-dialog";

export function DocumentActionRibbon({ 
	doc, 
	profile,
	previousInvoices = []
}: { 
	doc: DocumentWithRelations, 
	profile: BusinessProfile | null,
	previousInvoices?: DocumentWithRelations[]
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isPaymentOpen, setIsPaymentOpen] = useState(false);
	const [isPortionOpen, setIsPortionOpen] = useState(false);
	const [isFlushing, setIsFlushing] = useState(false);
	const flushDraft = useFlushDraft();
	const [isArchiveOpen, setIsArchiveOpen] = useState(false);

	const DONE: Partial<Record<B2BDocumentStatus, string>> = {
		sent: "Quotation marked as sent",
		unpaid: "Invoice issued",
		accepted: "Quotation accepted",
	};
	const handleStatusUpdate = (status: B2BDocumentStatus) => {
		startTransition(async () => {
			const res = await updateDocumentStatusAction(
				doc.id,
				status,
				doc.partnerId,
			);
			if (res.success) {
				notify.success(DONE[status] ?? "Document updated");
				router.refresh();
			} else {
				notifyActionError(res, "Failed to update document");
			}
		});
	};

	const confirm = useConfirm();

	const handleDeleteDraft = async () => {
		const ok = await confirm({
			title: `Delete ${doc.documentNumber ? `draft ${doc.documentNumber}` : "this draft invoice"}?`,
			description: "This can't be undone.",
			confirmLabel: "Delete draft",
			destructive: true,
		});
		if (!ok) return;
		startTransition(async () => {
			const res = await deleteDocumentAction(doc.id, doc.partnerId);
			if (res.success) {
				notify.success("Draft deleted");
				router.push("/b2b/documents");
			} else {
				notifyActionError(res, "Failed to delete draft");
			}
		});
	};

	const handleArchive = (reason: string) => {
		startTransition(async () => {
			const res = await archiveDocumentAction(doc.id, reason, doc.partnerId);
			if (res.success) {
				notify.success("Document archived");
				setIsArchiveOpen(false);
				router.refresh();
			} else {
				notifyActionError(res, "Failed to archive");
			}
		});
	};

	const isQuote = doc.type === "quote";
	const isInvoice = doc.type === "invoice";

	// Block "Mark as sent" until the partner has *some* numeric tax id.
	// Length isn't enforced — partners outside Morocco may use shorter
	// formats, and we don't want Odoo-style rigidity here.
	const partnerIceDigits = (doc.partner?.taxId ?? "").replace(/\D/g, "");
	const partnerIceValid = partnerIceDigits.length > 0;
	const blockSendForMissingIce = isInvoice && !partnerIceValid;
	useNotice(
		"missing-ice",
		!doc.archivedAt && doc.status === "draft" && blockSendForMissingIce
			? {
					tone: "warning",
					message: `${doc.partner?.companyName ?? "This partner"} has no ICE yet: add it before marking this invoice as sent.`,
					action: (
						<Link
							href={`/b2b/partners/${doc.partnerId}`}
							className="text-primary inline-flex min-h-10 items-center rounded-full px-2 text-sm font-semibold hover:underline"
						>
							Add it
						</Link>
					),
				}
			: null,
		String(!doc.archivedAt && doc.status === "draft" && blockSendForMissingIce),
	);

	const canRecordPayment = isPayableInvoice(doc);

	// What's billed of a quotation and what's left (its invoices, drafts
	// included, archived ones left out).
	const balance = quoteBalance(doc.lines ?? [], (doc.children ?? []) as DocumentWithRelations[]);
	const canInvoice =
		!doc.archivedAt &&
		isQuote &&
		(doc.status === "sent" || doc.status === "accepted") &&
		balance.remaining > 0;

	// Same scope and order as recordDocumentPaymentAction, so the dialog's
	// preview is exactly what the server will do.
	const paymentQueue: PaymentQueueEntry[] = orderPaymentQueue(
		doc.id,
		[doc, ...previousInvoices.filter((inv) => inv.id !== doc.id)]
			.filter(isPayableInvoice)
			.map((inv) => ({
				id: inv.id,
				documentNumber: inv.documentNumber ?? "",
				totalAmount: Number(inv.totalAmount),
				amountPaid: (inv.payments || []).reduce(
					(s, p) => s + Number(p.amount),
					0,
				),
			})),
	);

	return (
		// The document's actions, as a row of buttons on the right (its
		// quotation and payments have their own places on the page).
		<div className="animate-slide-up flex flex-wrap items-center justify-end gap-3 delay-100">
			<div className="flex flex-wrap items-center justify-end gap-3">
				<PDFDownloadBtn doc={doc} profile={profile} />

				{doc.archivedAt ? (
					<Badge
						variant="outline"
						className="border-warning/30 bg-warning/10 text-warning gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase"
					>
						<Archive size={12} variant="Bold" />
						Archived
					</Badge>
				) : null}



				{/* Draft -> Mark as sent (with the backorder check) */}
				{!doc.archivedAt && doc.status === "draft" ? (
					<>
						<Button
							onClick={async () => {
								// What she just typed (lines, notes) is saved first.
								setIsFlushing(true);
								const saved = await flushDraft();
								setIsFlushing(false);
								if (!saved) {
									notify.warning("Some changes aren't saved yet", "Fix what's marked on the page, then try again.");
									return;
								}
								// An invoice is issued (numbered, dated today, owed); a
								// quotation is sent. What's left of a quotation stays
								// there to invoice later: no need to decide now.
								handleStatusUpdate(isInvoice ? "unpaid" : "sent");
							}}
							disabled={isPending || isFlushing || blockSendForMissingIce}
							title={
								blockSendForMissingIce
									? "Add the partner's ICE (Tax ID) before issuing this invoice"
									: undefined
							}
							className="zen-glow-teal gap-2 rounded-xl font-bold"
						>
							<Send size={18} variant="Bold" />
							Mark as sent
						</Button>
					</>
				) : null}

				{/* Quote Specific: Sent -> Accepted */}
				{!doc.archivedAt && isQuote && doc.status === "sent" ? (
					<Button
						onClick={() => handleStatusUpdate("accepted")}
						disabled={isPending}
						className="bg-success text-success-foreground hover:bg-success/90 gap-2 rounded-xl font-bold shadow-sm"
					>
						<TickCircle size={18} variant="Bold" />
						Accept Quote
					</Button>
				) : null}

				{/* A sent or accepted quotation is invoiced in portions, for as long as something is left. */}
				{canInvoice ? (
					<>
						<Button
							onClick={() => setIsPortionOpen(true)}
							disabled={isPending}
							className="zen-glow-teal gap-2 rounded-xl font-bold shadow-md"
						>
							<ReceiptAdd size={18} variant="Bold" />
							{balance.billed > 0 ? "Invoice next portion" : "Create invoice"}
						</Button>
						<InvoicePortionSheet
							key={balance.remaining}
							quote={doc}
							balance={balance}
							open={isPortionOpen}
							onOpenChange={setIsPortionOpen}
						/>
					</>
				) : null}

				{/* Invoice Specific: any issued, not fully paid invoice -> Record Payment */}
				{canRecordPayment ? (
					<>
                        <Button
                            onClick={() => setIsPaymentOpen(true)}
                            disabled={isPending}
                            className="bg-success text-success-foreground hover:bg-success/90 gap-2 rounded-xl font-bold shadow-sm"
                        >
                            <MoneySend size={18} variant="Bold" />
                            Record Payment
                        </Button>
                        <RecordPaymentDialog
                            doc={doc}
                            queue={paymentQueue}
                            open={isPaymentOpen}
                            onOpenChange={setIsPaymentOpen}
                        />
                    </>
				) : null}

				{/* Retire action: drafts are deleted (irreversible);
				    issued documents are archived (preserves audit trail). */}
				{!doc.archivedAt && doc.status === "draft" ? (
					<Button
						onClick={handleDeleteDraft}
						disabled={isPending}
						variant="ghost"
						className="text-muted-foreground hover:bg-destructive/5 hover:text-destructive gap-2 rounded-xl font-medium"
					>
						<Trash size={18} />
						Delete Draft
					</Button>
				) : null}

				{!doc.archivedAt && doc.status !== "draft" ? (
					<>
						<Button
							onClick={() => setIsArchiveOpen(true)}
							disabled={isPending}
							variant="ghost"
							className="text-muted-foreground hover:bg-warning/10 hover:text-warning gap-2 rounded-xl font-medium"
						>
							<Archive size={18} />
							Archive
						</Button>
						<ArchiveDocumentDialog
							documentNumber={documentName(doc)}
							open={isArchiveOpen}
							onOpenChange={setIsArchiveOpen}
							onConfirm={handleArchive}
							pending={isPending}
						/>
					</>
				) : null}
			</div>
		</div>
	);
}
