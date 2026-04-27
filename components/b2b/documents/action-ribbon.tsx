"use client";

import { useState,useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	archiveDocumentAction,
	confirmInvoiceWithBackorderAction,
	convertQuoteToInvoiceAction,
	deleteDocumentAction,
	updateDocumentStatusAction,
} from "@/lib/actions/b2b/documents";
import type { BusinessProfile, DocumentWithRelations } from "@/lib/types/b2b";
import { type B2BDocument, type B2BDocumentStatus } from "@/lib/types/b2b";

import {
	Archive,
	ArrowRight,
	Convert,
	Link1,
	MoneySend,
	Send,
	TickCircle,
	Trash,
	Warning2,
} from "iconsax-reactjs";
import { toast } from "sonner";

import { ArchiveDocumentDialog } from "./archive-dialog";
import { BackorderDialog } from "./backorder-dialog";
import { PDFDownloadBtn } from "./download-btn";
import { RecordPaymentDialog } from "./record-payment-dialog";

export function DocumentActionRibbon({ 
	doc, 
	profile,
	previousInvoices = []
}: { 
	doc: DocumentWithRelations, 
	profile: BusinessProfile | null,
	previousInvoices?: any[]
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isPaymentOpen, setIsPaymentOpen] = useState(false);
	const [isBackorderOpen, setIsBackorderOpen] = useState(false);
	const [isArchiveOpen, setIsArchiveOpen] = useState(false);

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

	const handleDeleteDraft = () => {
		if (!confirm("Delete this draft? This cannot be undone.")) return;
		startTransition(async () => {
			const res = await deleteDocumentAction(doc.id, doc.partnerId);
			if (res.success) {
				toast.success("Draft deleted");
				router.push("/b2b/documents");
			} else {
				toast.error(res.error || "Failed to delete draft");
			}
		});
	};

	const handleArchive = (reason: string) => {
		startTransition(async () => {
			const res = await archiveDocumentAction(doc.id, reason, doc.partnerId);
			if (res.success) {
				toast.success("Document archived");
				setIsArchiveOpen(false);
				router.refresh();
			} else {
				toast.error(res.error || "Failed to archive");
			}
		});
	};

	const isQuote = doc.type === "quote";
	const isInvoice = doc.type === "invoice";

	// Morocco ICE (Identifiant Commun de l'Entreprise): 15 digits, mandatory on
	// B2B invoices. We block the "Confirm & Send" path for invoices when the
	// buyer has no valid ICE so the partner doesn't lose VAT deductibility.
	const buyerIce = doc.partner?.taxId?.trim() ?? "";
	const buyerIceValid = /^\d{15}$/.test(buyerIce);
	const blockSendForMissingIce = isInvoice && !buyerIceValid;

	return (
		<div className="animate-slide-up bg-card flex flex-wrap items-center gap-4 rounded-2xl border p-4 shadow-sm backdrop-blur-sm transition-all delay-100 duration-300">
			{/* Linked Documents / Relations (Left Side) */}
			{doc.parent || doc.children?.length ? (
				<div className="lg:border/50 flex flex-wrap items-center gap-4 lg:mr-2 lg:border-r lg:pr-5">
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
												className={`text-primary border-primary/30 hover:bg-primary hover:text-primary-foreground h-5 border px-1.5 text-[9px] font-bold tracking-widest uppercase transition-all duration-200 ${child.status === 'paid' ? 'bg-green-500/10' : ''}`}
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

				{doc.archivedAt ? (
					<Badge
						variant="outline"
						className="gap-1.5 rounded-xl border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold tracking-widest text-amber-700 uppercase"
					>
						<Archive size={12} variant="Bold" />
						Archived
					</Badge>
				) : null}

				{!doc.archivedAt && doc.status === "draft" && blockSendForMissingIce ? (
					<Link
						href={`/b2b/partners/${doc.partnerId}`}
						className="text-amber-700 hover:underline"
					>
						<Badge
							variant="outline"
							className="gap-1.5 rounded-xl border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold tracking-widest text-amber-700 uppercase"
						>
							<Warning2 size={12} variant="Bold" />
							Buyer ICE missing
						</Badge>
					</Link>
				) : null}

				{/* Draft -> Confirm & Send (With Backorder Logic) */}
				{!doc.archivedAt && doc.status === "draft" ? (
					<>
						<Button
							onClick={() => {
								const hasBilledItems = doc.lines?.some(l => l.sourceLineId && Number(l.quantity) > 0);
								
								// Smart Backorder Check:
								// Does this invoice (plus previous ones) leave any unbilled quantity from the parent quote?
								let hasUnbilledItems = false;
								if (isInvoice && doc.parent?.lines) {
									const parentLines = doc.parent.lines;
									
									// 1. Calculate how much has been billed so far across ALL invoices (previous + current)
									// We group by sourceLineId
									const billedTotals: Record<string, number> = {};
									
									// Add quantities from previous confirmed/partially_paid invoices
									previousInvoices.forEach(inv => {
										inv.lines?.forEach((line: any) => {
											if (line.sourceLineId) {
												billedTotals[line.sourceLineId] = (billedTotals[line.sourceLineId] || 0) + Number(line.quantity);
											}
										});
									});
									
									// Add quantities from the CURRENT draft invoice
									doc.lines?.forEach(line => {
										if (line.sourceLineId) {
											billedTotals[line.sourceLineId] = (billedTotals[line.sourceLineId] || 0) + Number(line.quantity);
										}
									});
									
									// 2. Compare with the Quote's required quantities
									hasUnbilledItems = parentLines.some(qLine => {
										const totalBilled = billedTotals[qLine.id] || 0;
										return totalBilled < Number(qLine.quantity);
									});
								}

								if (isInvoice && doc.parentDocumentId && hasBilledItems && hasUnbilledItems) {
									setIsBackorderOpen(true);
								} else {
									handleStatusUpdate("sent");
								}
							}}
							disabled={isPending || blockSendForMissingIce}
							title={
								blockSendForMissingIce
									? "Add the buyer's ICE on the partner before issuing this invoice"
									: undefined
							}
							className="zen-glow-teal gap-2 rounded-xl font-bold"
						>
							<Send size={18} variant="Bold" />
							Confirm & Send
						</Button>
						<BackorderDialog
							open={isBackorderOpen}
							onOpenChange={setIsBackorderOpen}
							onConfirm={(createBackorder) => {
								startTransition(async () => {
									const res = await confirmInvoiceWithBackorderAction(doc.id, createBackorder);
									if (res.success) {
										toast.success(createBackorder ? "Invoice confirmed and backorder created" : "Invoice confirmed");
										router.refresh();
									} else {
										toast.error(res.error || "Failed to confirm invoice");
									}
								});
							}}
						/>
					</>
				) : null}

				{/* Quote Specific: Sent -> Accepted */}
				{!doc.archivedAt && isQuote && doc.status === "sent" ? (
					<Button
						onClick={() => handleStatusUpdate("accepted")}
						disabled={isPending}
						className="gap-2 rounded-xl bg-green-600 font-bold text-white shadow-sm hover:bg-green-700"
					>
						<TickCircle size={18} variant="Bold" />
						Accept Quote
					</Button>
				) : null}

				{/* Quote Specific: Accepted -> Generate Invoice (Only if no invoices exist yet) */}
				{!doc.archivedAt && isQuote && doc.status === "accepted" && (!doc.children || doc.children.length === 0) ? (
					<Button
						onClick={() => {
							startTransition(async () => {
								const res = await convertQuoteToInvoiceAction(doc.id);
								if (res.success && res.id) {
									toast.success("Draft invoice created");
									router.push(`/b2b/documents/${res.id}`);
								} else {
									toast.error(res.error || "Failed to create draft invoice");
								}
							});
						}}
						disabled={isPending}
						className="zen-glow-teal gap-2 rounded-xl font-bold shadow-md"
					>
						<Convert size={18} variant="Bold" />
						Generate Invoice
						<ArrowRight size={16} />
					</Button>
				) : null}

				{/* Invoice Specific: Sent/Partially Paid -> Record Payment */}
				{!doc.archivedAt && isInvoice && (doc.status === "sent" || doc.status === "partially_paid") ? (
					<>
                        <Button
                            onClick={() => setIsPaymentOpen(true)}
                            disabled={isPending}
                            className="gap-2 rounded-xl bg-green-600 font-bold text-white shadow-sm hover:bg-green-700"
                        >
                            <MoneySend size={18} variant="Bold" />
                            Record Payment
                        </Button>
                        <RecordPaymentDialog 
                            doc={doc} 
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
							className="text-muted-foreground gap-2 rounded-xl font-medium hover:bg-amber-500/10 hover:text-amber-700"
						>
							<Archive size={18} />
							Archive
						</Button>
						<ArchiveDocumentDialog
							documentNumber={doc.documentNumber}
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
