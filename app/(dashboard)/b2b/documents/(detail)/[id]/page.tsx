import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentActionRibbon } from "@/components/b2b/documents/action-ribbon";
import { ChainStrip } from "@/components/b2b/documents/chain-strip";
import { DocumentTotals } from "@/components/b2b/documents/document-totals";
import { DraftSaveProvider } from "@/components/b2b/documents/draft-save";
import { EditableDocumentLines } from "@/components/b2b/documents/editable-lines";
import { DocumentStatusBadge } from "@/components/b2b/documents/status-badge";
import { EditableNotes } from "@/components/b2b/editable-notes";
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
import {
	type B2BDocumentLine,
	type DocumentWithRelations,
} from "@/lib/types/b2b";

import { format } from "date-fns";
import {
	ArrowLeft,
	Buildings,
	Calendar,
	DocumentText,
	MoneyTime,
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
	const currentTotal = parseFloat(document.totalAmount);
	const amountPaid = (document.payments || []).reduce(
		(sum, p) => sum + parseFloat(p.amount),
		0,
	);
	const amountDue = currentTotal - amountPaid;

	return (
		// A draft's lines and notes save themselves; its actions wait for them.
		<DraftSaveProvider>
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

			{/* Header Zen Card */}
			<div className="animate-slide-up border-secondary/20 bg-card relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border p-8 shadow-sm md:flex-row">
				<div className="text-primary absolute -top-10 right-0 p-8 opacity-5">
					{document.type === "invoice" ? (
						<ReceiptText size={240} variant="Bulk" />
					) : (
						<DocumentText size={240} variant="Bulk" />
					)}
				</div>

				<div className="relative z-10 flex flex-col gap-6">
					<div className="flex items-center gap-4">
						<div className="border-primary/20 bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl border shadow-inner">
							{document.type === "invoice" ? (
								<ReceiptText size={28} variant="Bulk" />
							) : (
								<DocumentText size={28} variant="Bulk" />
							)}
						</div>
						<div className="space-y-1">
							<div className="flex items-center gap-3">
								<h1 className="font-heading text-foreground text-3xl font-black tracking-tight">
									{document.documentNumber}
								</h1>
								<DocumentStatusBadge
									status={document.status}
									className="rounded-lg"
								/>
							</div>
							<p className="text-muted-foreground/60 text-xs font-bold tracking-wider uppercase">
								B2B {document.type}
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
										Due Date
									</span>
									<span className="text-foreground text-sm font-bold">
										{format(new Date(document.dueDate), "MMMM dd, yyyy")}
									</span>
								</div>
							</div>
						) : null}
					</div>
				</div>

				<div className="relative z-10 flex flex-col justify-end text-right">
					<span className="text-primary text-[10px] font-black tracking-widest uppercase opacity-40">
						{isQuote
							? "Quoted Amount"
							: amountPaid > 0
								? "Balance Due"
								: "Invoice Total"}
					</span>

					{amountPaid > 0 && !isQuote ? (
						<div className="flex flex-col">
							<div className="text-primary/30 font-heading decoration-primary/20 text-2xl font-black tabular-nums line-through decoration-2">
								{currentTotal.toLocaleString("en-US", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
								<span className="ml-2 text-sm font-bold">MAD</span>
							</div>
							<div className="text-primary font-heading zen-teal-glow text-4xl font-black tabular-nums">
								{(currentTotal - amountPaid).toLocaleString("en-US", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
								<span className="ml-2 text-base font-bold opacity-60">MAD</span>
							</div>
						</div>
					) : (
						<div className="text-primary font-heading zen-teal-glow text-4xl font-black tabular-nums">
							{currentTotal.toLocaleString("en-US", {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
							<span className="ml-2 text-base font-bold opacity-60">MAD</span>
						</div>
					)}
				</div>
			</div>

			{/* Backorder chain strip (only when this invoice is part of a multi-invoice chain) */}
			{chainInvoices.length > 1 ? (
				<ChainStrip
					invoices={chainInvoices}
					currentDocumentId={document.id}
					partnerName={document.partner?.companyName ?? null}
				/>
			) : null}

			{/* Actions Ribbon */}
			<DocumentActionRibbon
				doc={document}
				profile={profile}
				previousInvoices={accountSummary?.allRelatedInvoices || []}
			/>

			{/* Line Items Section */}
			{document.status === "draft" ? (
				<EditableDocumentLines
					documentId={document.id}
					initialLines={document.lines || []}
					initialTaxRate={document.taxRate}
					status={document.status}
				/>
			) : (
				<>
					<Table className="animate-slide-up delay-100">
						<TableHeader>
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
						<TableBody className="divide-secondary/15 divide-y">
							{document.lines?.map((line: B2BDocumentLine) => (
								<TableRow
									key={line.id}
									className="hover:bg-primary/5 border-none transition-colors"
								>
									<TableCell className="px-6 py-4">
										<p className="text-foreground text-sm font-bold">
											{line.description}
										</p>
									</TableCell>
									<TableCell className="text-center font-mono text-sm leading-none tabular-nums">
										{line.quantity}
									</TableCell>
									<TableCell className="text-right font-mono text-sm leading-none tabular-nums">
										{parseFloat(line.unitPrice).toLocaleString()}
										<span className="text-muted-foreground ml-1 text-[10px] font-normal">
											MAD
										</span>
									</TableCell>
									<TableCell className="pr-8 text-right font-mono text-sm font-black tabular-nums">
										{parseFloat(line.totalPrice).toLocaleString()}
										<span className="text-muted-foreground ml-1 text-[10px] font-normal">
											MAD
										</span>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					<div className="animate-slide-up flex w-full justify-end delay-200">
						<div className="w-full lg:max-w-md">
							<DocumentTotals
								document={document}
								currentTotal={currentTotal}
								amountPaid={amountPaid}
								amountDue={amountDue}
								isQuote={isQuote}
							/>
						</div>
					</div>
				</>
			)}

			{/* Notes Section */}
			<EditableNotes
				documentId={document.id}
				initialNotes={document.notes}
				readOnly={!!document.archivedAt || document.status !== "draft"}
			/>
		</DraftSaveProvider>
	);
}
