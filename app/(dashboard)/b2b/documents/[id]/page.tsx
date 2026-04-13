import Link from "next/link";
import { notFound } from "next/navigation";

import { getDocumentByIdAction } from "@/actions/b2b/documents";
import { DocumentActionRibbon } from "@/components/b2b/documents/action-ribbon";
import { EditableDocumentLines } from "@/components/b2b/documents/editable-lines";
import { EditableNotes } from "@/components/b2b/editable-notes";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { format } from "date-fns";
import {
	ArrowLeft,
	Buildings,
	Calendar,
	Clock,
	CloseCircle,
	DocumentText,
	Edit2,
	Link1,
	MoneyTime,
	ReceiptText,
	TickCircle,
} from "iconsax-reactjs";

type Params = Promise<{ id: string }>;

export default async function DocumentDetailPage(props: { params: Params }) {
	const { id } = await props.params;
	const { document, error } = await getDocumentByIdAction(id);

	if (error || !document) {
		return notFound();
	}

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

	const status = getStatusProps(document.status);

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
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
								<Badge
									variant={status.variant}
									className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase transition-all"
								>
									{status.icon}
									{status.label}
								</Badge>
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

						{document.dueDate && (
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
						)}
					</div>
				</div>

				<div className="relative z-10 flex flex-col justify-end text-right">
					<span className="text-primary text-[10px] font-black tracking-widest uppercase opacity-40">
						Total Amount
					</span>
					<div className="text-primary font-heading zen-teal-glow text-4xl font-black tabular-nums">
						{parseFloat(document.totalAmount).toLocaleString("en-US", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
						<span className="ml-2 text-base font-bold opacity-60">MAD</span>
					</div>
				</div>
			</div>

			{/* Linked Documents Alert */}
			{document.parent || document.children?.length > 0 ? (
				<div className="animate-slide-up border-foreground/10 bg-card flex items-center gap-4 rounded-2xl border px-6 py-4 shadow-sm">
					<div className="bg-primary/15 text-primary zen-teal-glow flex size-10 items-center justify-center rounded-full">
						<Link1 size={20} variant="Bulk" />
					</div>
					<div className="flex flex-wrap gap-x-6 gap-y-2">
						{document.parent ? (
							<div className="flex flex-col">
								<span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-50">
									Source Quote:
								</span>

								<Link href={`/b2b/documents/${document.parent.id}`}>
									<Badge
										variant="outline"
										className="text-primary border-primary hover:bg-primary hover:text-primary-foreground border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase transition-all duration-200"
									>
										{document.parent.documentNumber}
									</Badge>
								</Link>
							</div>
						) : null}
						{document.children?.length > 0
							? document.children.map((child: any) => (
									<div key={child.id} className="flex flex-col">
										<span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-50">
											Generated Invoice:
										</span>
										<div className="flex items-center gap-2">
											<Link href={`/b2b/documents/${child.id}`}>
												<Badge
													variant="outline"
													className="text-primary border-primary hover:bg-primary hover:text-primary-foreground border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase transition-all duration-200"
												>
													{child.documentNumber}
												</Badge>
											</Link>
										</div>
									</div>
								))
							: null}
					</div>
				</div>
			) : null}

			{/* Actions Ribbon */}
			<DocumentActionRibbon doc={document} />

			{/* Line Items Section */}
			{document.status === "draft" ? (
				<EditableDocumentLines
					documentId={document.id}
					initialLines={document.lines}
					initialTaxRate={document.taxRate}
					status={document.status}
				/>
			) : (
				<>
					<div className="animate-slide-up border-foreground/10 bg-card overflow-hidden rounded-2xl border shadow-sm delay-100">
						<Table>
							<TableHeader className="bg-sidebar">
								<TableRow className="border-foreground/10 border-b hover:bg-transparent">
									<TableHead className="text-muted-foreground h-10 px-6 text-[10px] font-bold tracking-widest uppercase">
										Description
									</TableHead>
									<TableHead className="text-muted-foreground h-10 w-24 px-2 text-center text-[10px] font-bold tracking-widest uppercase">
										Qty
									</TableHead>
									<TableHead className="text-muted-foreground h-10 w-32 px-2 text-right text-[10px] font-bold tracking-widest uppercase">
										Unit Price
									</TableHead>
									<TableHead className="text-muted-foreground h-10 w-40 px-2 pr-8 text-right text-[10px] font-bold tracking-widest uppercase">
										Total
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody className="divide-secondary/15 divide-y">
								{document.lines?.map((line: any) => (
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
										</TableCell>
										<TableCell className="pr-8 text-right font-mono text-sm font-black tabular-nums">
											{parseFloat(line.totalPrice).toLocaleString()}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					<div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
						<div className="border-foreground/10 bg-card flex w-full flex-col items-end gap-2.5 rounded-2xl border p-4 shadow-sm sm:max-w-xs">
							<div className="flex w-full items-center justify-between gap-4">
								<span className="text-muted-foreground/70 text-[10px] font-bold tracking-widest uppercase">
									Subtotal
								</span>
								<span className="font-heading text-foreground text-lg font-bold tabular-nums">
									{parseFloat(document.subtotal).toLocaleString()}
									<span className="text-muted-foreground ml-1 text-xs font-normal">
										MAD
									</span>
								</span>
							</div>
							<div className="flex w-full items-center justify-between gap-4">
								<span className="text-muted-foreground/70 text-[10px] font-bold tracking-widest uppercase">
									Tax ({parseFloat(document.taxRate)}%)
								</span>
								<span className="font-heading text-foreground text-lg font-bold tabular-nums">
									{(
										parseFloat(document.subtotal) *
										(parseFloat(document.taxRate) / 100)
									).toLocaleString(undefined, {
										minimumFractionDigits: 0,
										maximumFractionDigits: 2,
									})}
									<span className="text-muted-foreground ml-1 text-xs font-normal">
										MAD
									</span>
								</span>
							</div>
							<Separator className="w-full" />
							<div className="flex w-full items-center justify-between gap-4">
								<span className="text-primary text-[10px] font-black tracking-widest uppercase">
									Total
								</span>
								<span className="font-heading text-primary zen-teal-glow text-3xl font-black tabular-nums">
									{parseFloat(document.totalAmount).toLocaleString()}
									<span className="text-primary ml-1.5 text-sm font-semibold">
										MAD
									</span>
								</span>
							</div>
						</div>
					</div>
				</>
			)}

			{/* Notes Section */}
			<EditableNotes documentId={document.id} initialNotes={document.notes} />
		</div>
	);
}
