import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentActionRibbon } from "@/components/b2b/documents/action-ribbon";
import { CreditOrigin } from "@/components/b2b/documents/credit-origin";
import { DocumentSection } from "@/components/b2b/documents/document-section";
import { DocumentTotals } from "@/components/b2b/documents/document-totals";
import { DraftSaveProvider } from "@/components/b2b/documents/draft-save";
import { EditableDocumentLines } from "@/components/b2b/documents/editable-lines";
import { HeroAmount } from "@/components/b2b/documents/hero-amount";
import { InvoiceOrigin } from "@/components/b2b/documents/invoice-origin";
import { InvoicePayments } from "@/components/b2b/documents/invoice-payments";
import { DocumentNotices, NoticesProvider } from "@/components/b2b/documents/notices";
import { phoneLine } from "@/components/b2b/documents/phone-line";
import { QuoteInvoicing } from "@/components/b2b/documents/quote-invoicing";
import { RecordPaymentButton } from "@/components/b2b/documents/record-payment-button";
import { RecordRefundButton } from "@/components/b2b/documents/record-refund-button";
import { DocumentStatusBadge } from "@/components/b2b/documents/status-badge";
import { EditableNotes } from "@/components/b2b/editable-notes";
import { Money } from "@/components/money";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getDocumentByIdAction } from "@/lib/actions/b2b/documents";
import { getBusinessProfileAction } from "@/lib/actions/business-profile";
import { documentKind, documentName } from "@/lib/domain/billing/document-name";
import { displayStatus, documentAmounts } from "@/lib/domain/billing/payments";
import { quoteTape } from "@/lib/domain/billing/quote-tape";
import { quantityOf } from "@/lib/domain/price-list/product";
import {
	type B2BDocumentLine,
	type DocumentWithRelations,
} from "@/lib/types/b2b";
import { formatMoney } from "@/lib/utils/currency";
import { studioDateString } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";

import { format } from "date-fns";
import {
	ArrowLeft,
	Buildings,
	Calendar,
	DocumentText,
	MoneyTime,
	ReceiptMinus,
	ReceiptText,
} from "iconsax-reactjs";

type Params = Promise<{ id: string }>;

export default async function DocumentDetailPage(props: { params: Params }) {
	const { id } = await props.params;
	const { document, accountSummary, error } = (await getDocumentByIdAction(
		id,
	)) as {
		document: DocumentWithRelations | null;
		accountSummary?: {
			previousInvoices: DocumentWithRelations[];
			allRelatedInvoices?: DocumentWithRelations[];
			chainInvoices?: DocumentWithRelations[];
		};
		error?: string;
	};

	if (error || !document) {
		return notFound();
	}

	const profile = await getBusinessProfileAction();

	const chainInvoices = accountSummary?.chainInvoices || [];

	// Financial Calculations
	const isQuote = document.type === "quote";
	const today = studioDateString();
	const KindIcon = document.type === "credit_note" ? ReceiptMinus : document.type === "invoice" ? ReceiptText : DocumentText;
	// A draft credit note waiting on this invoice: said once, at the top.
	const draftCredits = (document.type === "invoice" ? (document.children ?? []) : [])
		.filter((child) => child.type === "credit_note" && child.status === "draft")
		.map((child) => ({
			id: `draft-credit-${child.id}`,
			tone: "info" as const,
			message: `A draft credit note of ${formatMoney(Number(child.totalAmount))} is waiting for this invoice.`,
			action: (
				<Link href={`/b2b/documents/${child.id}`} className="text-primary inline-flex min-h-10 items-center rounded-full px-2 text-sm font-semibold hover:underline">
					Open it
				</Link>
			),
		}));

	return (
		// A draft's lines and notes save themselves; its actions wait for them.
		<DraftSaveProvider>
			<NoticesProvider>
			{/* Breadcrumb */}
			<Link
				href="/b2b/documents"
				className="group text-muted-foreground hover:text-primary flex w-fit items-center gap-2 text-sm transition-colors"
			>
				<ArrowLeft
					size={16}
					className="transition-transform group-hover:-translate-x-1"
				/>
				Back to Documents
			</Link>

			{/* Errors, warnings and notes about this document, in one place */}
			<DocumentNotices notices={draftCredits} />

			{/* Header Zen Card */}
			<div className="animate-slide-up border-secondary/20 bg-card relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border p-6 shadow-sm sm:p-8 md:flex-row">
				<div className="text-primary absolute -top-10 right-0 p-8 opacity-5">
					<KindIcon size={240} variant="Bulk" />
				</div>

				<div className="relative z-10 flex flex-col gap-6">
					<div className="flex items-center gap-4">
						<div className="border-primary/20 bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl border shadow-inner">
							<KindIcon size={28} variant="Bulk" />
						</div>
						<div className="min-w-0 space-y-1">
							{/* The number never breaks at its dashes; the status goes under it when there's no room. */}
							<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
								<h1 className="font-heading text-foreground text-2xl font-black tracking-tight whitespace-nowrap sm:text-3xl">
									{documentName(document)}
								</h1>
								<DocumentStatusBadge
									status={displayStatus(document, today)}
									className="rounded-lg"
								/>
							</div>
							<p className="text-muted-foreground/60 text-xs font-bold tracking-wider uppercase">
								{documentKind(document.type)}
							</p>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						<div className="flex items-center gap-3">
							<div className="bg-secondary/40 text-secondary-3 flex size-10 items-center justify-center rounded-xl">
								<Buildings size={20} variant="Bulk" />
							</div>
							<div className="flex flex-col">
								<span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-50">
									Partner
								</span>
								<Link
									href={`/b2b/partners/${document.partnerId}`}
									className="text-foreground text-sm font-bold hover:underline"
								>
									{document.partner?.companyName}
								</Link>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<div className="bg-secondary/40 text-secondary-3 flex size-10 items-center justify-center rounded-xl">
								<Calendar size={20} variant="Bulk" />
							</div>
							<div className="flex flex-col">
								<span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-50">
									Issued On
								</span>
								<span className="text-foreground text-sm font-bold">
									{format(new Date(document.issueDate), "MMMM dd, yyyy")}
								</span>
							</div>
						</div>

						{document.dueDate ? (
							<div className="flex items-center gap-3">
								<div className="bg-secondary/40 text-secondary-3 flex size-10 items-center justify-center rounded-xl">
									<MoneyTime size={20} variant="Bulk" />
								</div>
								<div className="flex flex-col">
									<span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-50">
										{isQuote ? "Valid until" : "Due date"}
									</span>
									<span className="text-foreground text-sm font-bold">
										{format(new Date(document.dueDate), "MMMM dd, yyyy")}
									</span>
								</div>
							</div>
						) : null}
					</div>
				</div>

				<HeroAmount doc={document} />
			</div>

			{/* An invoice's quotation: its tape, this invoice standing out. */}
			{document.type === "invoice" && document.parent ? (
				<InvoiceOrigin
					invoiceId={document.id}
					quote={document.parent}
					tape={quoteTape(document.parent.totalAmount, chainInvoices, today)}
				/>
			) : null}

			{/* A credit note's invoice: what it takes back, and where that went. */}
			{document.type === "credit_note" && document.parent ? (
				<CreditOrigin note={document} invoice={document.parent} />
			) : null}

			{/* Actions Ribbon */}
			<DocumentActionRibbon
				doc={document}
				profile={profile}
				previousInvoices={accountSummary?.allRelatedInvoices || []}
			/>

			{/* A quotation billed over time: what's invoiced, what's left. */}
			{isQuote && document.children?.length ? (
				<QuoteInvoicing tape={quoteTape(document.totalAmount, document.children, today)} />
			) : null}

			{/* Line Items Section */}
			{document.status === "draft" ? (
				<EditableDocumentLines
					documentId={document.id}
					initialLines={document.lines || []}
					initialTaxRate={document.taxRate}
					status={document.status}
					taxLocked={document.type === "invoice" && !!document.parentDocumentId}
				/>
			) : (
				<DocumentSection
					id="line-items"
					title="Line items"
					className="animate-slide-up delay-100"
				>
					<div className="space-y-6">
					{/* On a phone each line reads "2 × 450 MAD" under its description, its total on the right. */}
					<Table className={phoneLine.table}>
						<TableHeader className={phoneLine.head}>
							<TableRow className="border-b transition-colors hover:bg-transparent">
								<TableHead className="px-6">Description</TableHead>
								<TableHead className="w-24 px-2 text-center">Qty</TableHead>
								<TableHead className="w-32 px-2 text-right">
									Unit Price
								</TableHead>
								<TableHead className="w-40 px-2 pr-8 text-right">
									Total
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody
							className={cn("divide-secondary/15 divide-y", phoneLine.body)}
						>
							{document.lines?.map((line: B2BDocumentLine) => (
								<TableRow
									key={line.id}
									className="hover:bg-primary/5 border-none transition-colors max-sm:flex max-sm:flex-wrap max-sm:items-baseline max-sm:gap-x-2 max-sm:gap-y-1 max-sm:px-4 max-sm:py-3"
								>
									<TableCell className="px-6 py-4 max-sm:basis-full max-sm:p-0 max-sm:whitespace-normal">
										<p className="text-foreground text-sm font-bold">
											{line.description}
										</p>
									</TableCell>
									<TableCell className="text-center font-mono text-sm leading-none tabular-nums max-sm:p-0">
										{quantityOf(line.quantity, line.unit)}
									</TableCell>
									<TableCell className="max-sm:before:text-muted-foreground text-right font-mono text-sm leading-none tabular-nums max-sm:p-0 max-sm:before:mr-2 max-sm:before:content-['×']">
										<Money amount={parseFloat(line.unitPrice)} />
									</TableCell>
									<TableCell className="pr-8 text-right font-mono text-sm font-black tabular-nums max-sm:ml-auto max-sm:p-0">
										<Money amount={parseFloat(line.totalPrice)} />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					<div className="flex w-full justify-end">
						<div className="w-full sm:max-w-xs">
							<DocumentTotals document={document} />
						</div>
					</div>
					</div>
				</DocumentSection>
			)}

			{/* An issued invoice's payments (or a credit note's settlement), from issue to settled. */}
			{!isQuote && document.status !== "draft" ? (
				<InvoicePayments
					invoice={document}
					action={
						document.type === "credit_note" ? (
							<RecordRefundButton
								creditNoteId={document.id}
								creditNoteName={documentName(document)}
								toRefund={documentAmounts(document).toRefund}
								className="h-9 gap-2 rounded-xl px-3 text-sm font-bold"
							/>
						) : (
							<RecordPaymentButton
								doc={document}
								siblings={accountSummary?.allRelatedInvoices ?? []}
								className="h-9 px-3 text-sm"
							/>
						)
					}
				/>
			) : null}

			{/* Notes Section */}
			<EditableNotes
				documentId={document.id}
				initialNotes={document.notes}
				readOnly={!!document.archivedAt || document.status !== "draft"}
			/>
			</NoticesProvider>
		</DraftSaveProvider>
	);
}
