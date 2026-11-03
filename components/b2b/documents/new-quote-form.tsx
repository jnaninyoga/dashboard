"use client";

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ContactDialog } from "@/components/b2b/contacts/dialog";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { createDocumentAction } from "@/lib/actions/b2b/documents";
import { getProducts } from "@/lib/actions/price-list";
import { mergeSameLines } from "@/lib/domain/billing/same-lines";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { type Product } from "@/lib/types";
import {
	type B2BContact,
	type B2BPartner,
} from "@/lib/types/b2b";
import { CURRENCY, normalizeDecimalInput } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/ui";
import { createDocumentWithLinesSchema, withoutBlankLines } from "@/lib/validators/document";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	ArrowLeft,
	Buildings,
	Calendar,
	DocumentText,
	Edit2,
	MoneyTime,
	Refresh,
	Save2,
	Trash,
	UserAdd,
} from "iconsax-reactjs";
import { type z } from "zod";

import { DescriptionAutocomplete, LineUnitNote } from "./description-autocomplete";
import { DocumentSection } from "./document-section";
import { blankLine, cellProps, focusCell, useFluidLines } from "./fluid-lines";
import { type DocumentNotice, DocumentNotices, NoticeAction } from "./notices";
import { phoneLine } from "./phone-line";

type CreateValues = z.input<typeof createDocumentWithLinesSchema>;

const today = () => new Date().toISOString().split("T")[0];
const inDays = (n: number) =>
	new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

export function NewQuoteForm({
	partner,
	contacts,
	previewNumber,
}: {
	partner: B2BPartner;
	contacts: B2BContact[];
	previewNumber: string;
}) {
	const router = useRouter();
	const [services, setServices] = useState<Product[]>([]);
	const [state, formAction, isPending] = useActionState(
		createDocumentAction,
		null,
	);
	const handledStateRef = useRef<typeof state>(null);

	const form = useForm<CreateValues>({
		resolver: zodResolver(createDocumentWithLinesSchema),
		defaultValues: {
			document: {
				partnerId: partner.id,
				// Optional: without one, the quotation is addressed to the company.
				contactId: contacts.find((c) => c.isPrimary)?.id ?? contacts[0]?.id ?? null,
				type: "quote",
				status: "draft",
				// Preview only — the server reserves the real number at insert.
				documentNumber: previewNumber,
				issueDate: today(),
				dueDate: inDays(7),
				subtotal: "0",
				taxRate: "0",
				totalAmount: "0",
				notes: "",
				parentDocumentId: null,
			},
			// The line waiting at the end of the table (see useFluidLines).
			lines: [blankLine()],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "lines",
	});

	useEffect(() => {
		getProducts("partner_service").then(setServices);
	}, []);

	// A contact added from this page becomes the recipient.
	const knownContacts = useRef(new Set(contacts.map((c) => c.id)));
	useEffect(() => {
		const added = contacts.find((c) => !knownContacts.current.has(c.id));
		knownContacts.current = new Set(contacts.map((c) => c.id));
		if (added) form.setValue("document.contactId", added.id);
	}, [contacts, form]);

	useEffect(() => {
		if (!state || handledStateRef.current === state) return;
		handledStateRef.current = state;
		if (state.success && state.id) {
			notify.success("Quote created");
			router.push(`/b2b/documents/${state.id}`);
		} else if (state.error) {
			notifyActionError(state, "Something went wrong");
		}
	}, [state, router]);

	const linesWatcher = useWatch({ control: form.control, name: "lines" });
	const { isWaiting, removeLine, keyDown, focusWaiting, pick, describe, leaveLine, grownId, announcement } = useFluidLines({
		count: fields.length,
		lines: linesWatcher,
		ids: fields.map((field) => field.id),
		getLines: () => form.getValues("lines"),
		set: (index, patch) => form.setValue(`lines.${index}`, { ...form.getValues(`lines.${index}`), ...patch }),
		append,
		remove,
		services,
	});
	const taxRateWatcher = useWatch({
		control: form.control,
		name: "document.taxRate",
	});

	const subtotal = useMemo(
		() =>
			linesWatcher.reduce(
				(acc, line) =>
					acc + (Number(line.unitPrice) * Number(line.quantity) || 0),
				0,
			),
		[linesWatcher],
	);
	const taxAmount = subtotal * (Number(taxRateWatcher || 0) / 100);
	const totalAmount = subtotal + taxAmount;

	const issueDate = useWatch({
		control: form.control,
		name: "document.issueDate",
	});
	const dueDate = useWatch({ control: form.control, name: "document.dueDate" });

	// The waiting line (and any she emptied) isn't a line: drop it, put a
	// repeated item on one line, then check.
	const submit = (event: React.FormEvent) => {
		event.preventDefault();
		form.setValue("lines", mergeSameLines(withoutBlankLines(form.getValues("lines"))));
		// What's missing shows in the notices at the top (and on the line).
		void form.handleSubmit(onSubmit)();
	};

	const onSubmit = (values: CreateValues) => {
		// Server recomputes totals from lines + taxRate; we still send sane
		// strings so the existing validator passes.
		// Inside a transition, so the pending state (spinner, disabled button) shows.
		startTransition(() => formAction({
			...values,
			document: {
				...values.document,
				subtotal: subtotal.toFixed(2),
				totalAmount: totalAmount.toFixed(2),
			},
		}));
	};

	// Errors (after a create attempt), warnings and notes, all in one place.
	const contactId = useWatch({ control: form.control, name: "document.contactId" });
	const { errors, submitCount } = form.formState;
	const notices: DocumentNotice[] = [];
	if (submitCount > 0) {
		if (errors.lines?.root?.message ?? errors.lines?.message) {
			notices.push({
				id: "no-lines",
				tone: "error",
				message: "Add at least one line before creating the quotation.",
				action: <NoticeAction onClick={focusWaiting}>Add a line</NoticeAction>,
			});
		}
		if (Array.isArray(errors.lines)) {
			errors.lines.forEach((lineErrors, index) => {
				if (!lineErrors) return;
				const column = lineErrors.description ? "description" : lineErrors.quantity ? "quantity" : "unitPrice";
				notices.push({
					id: `line-${index}`,
					tone: "error",
					message:
						column === "description"
							? `Line ${index + 1} needs a description.`
							: column === "quantity"
								? `Line ${index + 1} needs a quantity.`
								: `Line ${index + 1} needs a price.`,
					action: <NoticeAction onClick={() => focusCell(index, column)}>Show</NoticeAction>,
				});
			});
		}
		if (errors.document?.issueDate) {
			notices.push({ id: "issue-date", tone: "error", message: "Pick the issue date." });
		}
	}
	if (!partner.taxId) {
		notices.push({
			id: "ice",
			tone: "warning",
			message: `${partner.companyName} has no ICE yet. You'll need it to issue their invoices.`,
			action: (
				<Link
					href={`/b2b/partners/${partner.id}`}
					className="inline-flex min-h-10 items-center rounded-full px-2 text-sm font-semibold text-primary hover:underline"
				>
					Add it
				</Link>
			),
		});
	}
	if (!contactId) {
		notices.push({
			id: "contact",
			tone: "info",
			message: `No contact: the quotation is addressed to ${partner.companyName}.`,
			action: (
				<ContactDialog partnerId={partner.id} onSaved={() => router.refresh()}>
					<NoticeAction disabled={isPending}>
						<UserAdd size={18} variant="Bulk" />
						Add a contact
					</NoticeAction>
				</ContactDialog>
			),
		});
	}

	return (
		<Form {...form}>
			<form
				onSubmit={submit}
				className="flex flex-col gap-6"
			>
				{/* Breadcrumb */}
				<Link
					href={`/b2b/partners/${partner.id}`}
					className="group flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
				>
					<ArrowLeft
						size={16}
						className="transition-transform group-hover:-translate-x-1"
					/>
					Back to {partner.companyName}
				</Link>

				<DocumentNotices notices={notices} />

				{/* Hero card — mirrors the detail page so create / view share one mental model */}
				<div className="relative flex animate-slide-up flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-secondary/20 bg-card p-6 shadow-sm sm:p-8 md:flex-row">
					<div className="absolute -top-10 right-0 p-8 text-primary opacity-5">
						<DocumentText size={240} variant="Bulk" />
					</div>

					<div className="relative z-10 flex flex-col gap-6">
						<div className="flex items-center gap-4">
							<div className="flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-inner">
								<DocumentText size={28} variant="Bulk" />
							</div>
							<div className="min-w-0 space-y-1">
								{/* The number never breaks at its dashes; the status goes under it when there's no room. */}
								<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
									<h1 className="font-heading text-2xl font-black tracking-tight whitespace-nowrap text-foreground sm:text-3xl">
										{previewNumber}
									</h1>
									<Badge
										variant="muted"
										className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase"
									>
										<Edit2 size={14} variant="Bold" /> Draft
									</Badge>
								</div>
								<p className="text-xs font-bold tracking-wider text-muted-foreground/60 uppercase">
									New B2B Quotation
								</p>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
							<div className="flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-xl bg-secondary/40 text-secondary-3">
									<Buildings size={20} variant="Bulk" />
								</div>
								<div className="flex min-w-0 flex-col">
									<span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase opacity-50">
										Partner
									</span>
									<span className="truncate text-sm font-bold text-foreground">
										{partner.companyName}
									</span>
								</div>
							</div>

							<FormField
								control={form.control}
								name="document.issueDate"
								render={({ field }) => (
									<FormItem className="flex items-center gap-3 space-y-0">
										<div className="flex size-10 items-center justify-center rounded-xl bg-secondary/40 text-secondary-3">
											<Calendar size={20} variant="Bulk" />
										</div>
										<div className="flex flex-col">
											<FormLabel className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase opacity-50">
												Issue Date
											</FormLabel>
											<FormControl>
												<Input
													type="date"
													{...field}
													className="h-7 border-0 bg-transparent p-0 text-sm font-bold shadow-none focus-visible:ring-0"
													disabled={isPending}
												/>
											</FormControl>
										</div>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="document.dueDate"
								render={({ field }) => (
									<FormItem className="flex items-center gap-3 space-y-0">
										<div className="flex size-10 items-center justify-center rounded-xl bg-secondary/40 text-secondary-3">
											<MoneyTime size={20} variant="Bulk" />
										</div>
										<div className="flex flex-col">
											<FormLabel className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase opacity-50">
												Valid until
											</FormLabel>
											<FormControl>
												<Input
													type="date"
													{...field}
													value={field.value || ""}
													className="h-7 border-0 bg-transparent p-0 text-sm font-bold shadow-none focus-visible:ring-0"
													disabled={isPending}
												/>
											</FormControl>
										</div>
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="document.contactId"
							render={({ field }) => (
								<FormItem className="space-y-1">
									<FormLabel className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase opacity-50">
										Recipient contact
									</FormLabel>
									{contacts.length > 0 ? (
										<Select
											value={field.value ?? "none"}
											disabled={isPending}
											onValueChange={(val) => field.onChange(val === "none" ? null : val)}
										>
											<FormControl>
												<SelectTrigger className="w-full max-w-sm border bg-card font-semibold">
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{contacts.map((c) => (
													<SelectItem key={c.id} value={c.id} className="font-semibold">
														<span>{c.fullName}</span>
														{c.role ? (
															<span className="text-[10px] opacity-50">
																{" "}
																· {c.role}
															</span>
														) : null}
														{c.isPrimary ? (
															<span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary uppercase">
																Primary
															</span>
														) : null}
													</SelectItem>
												))}
												<SelectItem value="none">No contact (addressed to the company)</SelectItem>
											</SelectContent>
										</Select>
									) : (
										// The notice at the top says what this means, and offers to add one.
										<p className="text-sm text-muted-foreground">No contact</p>
									)}
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</div>

				<DocumentSection
					id="line-items"
					title="Line items"
					// No "Add" button: an empty line always waits at the end of the table.
					className="animate-slide-up delay-100"
				>
					<div>
					<p aria-live="polite" className="sr-only">
						{announcement}
					</p>
					<div className="overflow-x-auto">
						<Table className={phoneLine.table}>
							<TableHeader className={phoneLine.head}>
								<TableRow className="border-b transition-colors hover:bg-transparent">
									<TableHead className="px-4">Description</TableHead>
									<TableHead className="w-[72px] px-2 text-center">Qty</TableHead>
									<TableHead className="w-[104px] px-2 text-center">
										Unit Price
									</TableHead>
									<TableHead className="w-[80px] px-2 text-right">Total</TableHead>
									<TableHead className="w-[40px] p-0" />
								</TableRow>
							</TableHeader>
							<TableBody className={cn("divide-y divide-secondary/15", phoneLine.body)}>
								{fields.map((field, index) => {
									const waiting = isWaiting(index);
									return (
									<TableRow
										key={field.id}
										onBlur={leaveLine(index)}
										className={cn(
											"border-none transition-colors duration-500 hover:bg-primary/5",
											grownId === field.id && "bg-primary/10 hover:bg-primary/10",
											phoneLine.row,
										)}
									>
										<TableCell className={cn("px-4 py-3 align-top", phoneLine.description)}>
											<FormField
												control={form.control}
												name={`lines.${index}.description`}
												render={({ field: f }) => (
													<FormItem className="space-y-0">
														<FormControl>
															<DescriptionAutocomplete
																value={f.value}
																onChange={(text) => {
																	f.onChange(text);
																	describe(index, text);
																}}
																disabled={isPending}
																services={services}
																// Her prices open by themselves on an empty line: no need to say so.
																placeholder={waiting ? "Add a line…" : "Description…"}
																inputProps={{
																	"aria-label": waiting ? "Add a line" : `Description, line ${index + 1}`,
																	onKeyDown: keyDown(index, "description"),
																	...cellProps(index, "description"),
																}}
																inputClassName={cn(phoneLine.input, waiting && "border-dashed")}
																onPick={(service, label) =>
																	pick(index, { description: label, unitPrice: service.price, productId: service.id, unit: service.unit })
																}
															/>
														</FormControl>
														<FormMessage className="text-[10px]" />
													</FormItem>
												)}
											/>
											<LineUnitNote unit={linesWatcher[index]?.unit} />
										</TableCell>
										<TableCell className={cn("px-2 py-3 align-top", phoneLine.cell)}>
											{waiting ? null : (
												<FormField
												control={form.control}
												name={`lines.${index}.quantity`}
												render={({ field: f }) => (
													<Input
														inputMode="decimal"
														aria-label={`Quantity, line ${index + 1}`}
														onKeyDown={keyDown(index, "quantity")}
												onFocus={(event) => event.currentTarget.select()}
														{...cellProps(index, "quantity")}
														{...f}
														value={f.value ?? ""}
														className={cn("h-8 w-full border bg-card text-center font-mono text-sm font-bold", phoneLine.input)}
														disabled={isPending}
														onChange={(e) => {
															const val = normalizeDecimalInput(e.target.value);
															const parts = val.split(".");
															f.onChange(
																parts[0] +
																	(parts.length > 1
																		? "." + parts.slice(1).join("")
																		: ""),
															);
														}}
													/>
												)}
											/>
										)}
										</TableCell>
										<TableCell className={cn("px-2 py-3 align-top", phoneLine.cell, phoneLine.price)}>
											{waiting ? null : (
												<FormField
												control={form.control}
												name={`lines.${index}.unitPrice`}
												render={({ field: f }) => (
													<div className="relative min-w-0 flex-1">
														<Input
															inputMode="decimal"
															aria-label={`Unit price, line ${index + 1}`}
															onKeyDown={keyDown(index, "unitPrice")}
												onFocus={(event) => event.currentTarget.select()}
															{...cellProps(index, "unitPrice")}
															{...f}
															value={f.value ?? ""}
															className={cn("h-8 w-full border bg-card pr-8 text-center font-mono text-sm font-bold", phoneLine.input)}
															disabled={isPending}
															onChange={(e) => {
																const val = normalizeDecimalInput(e.target.value);
																const parts = val.split(".");
																f.onChange(
																	parts[0] +
																		(parts.length > 1
																			? "." + parts.slice(1).join("")
																			: ""),
																);
															}}
														/>
														<span className="absolute top-1/2 right-2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground/40">{CURRENCY}</span>
													</div>
												)}
											/>
										)}
										</TableCell>
										<TableCell className={cn("px-2 py-4 text-right align-top", phoneLine.cell)}>
											{waiting ? null : (
											<span className="font-mono text-sm font-black text-foreground tabular-nums">
												<Money amount={(Number(linesWatcher[index]?.quantity) || 0) * (Number(linesWatcher[index]?.unitPrice) || 0)} />
											</span>
										)}
										</TableCell>
										<TableCell className={cn("py-3 text-center align-top", phoneLine.cell)}>
											{waiting ? null : (
												<Button
													type="button"
													size="icon"
													aria-label={`Remove line ${index + 1}`}
													className={cn("size-8 cursor-pointer rounded-xl bg-destructive/5 text-destructive transition-all hover:scale-105 hover:bg-destructive/10 active:scale-90", phoneLine.remove)}
													onClick={() => removeLine(index)}
													disabled={isPending}
												>
													<Trash size={15} variant="Bold" />
												</Button>
											)}
										</TableCell>
									</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
					{form.formState.errors.lines?.root?.message ?? form.formState.errors.lines?.message ? (
						<p role="alert" className="mt-2 px-4 text-sm text-destructive">
							{form.formState.errors.lines?.root?.message ?? form.formState.errors.lines?.message}
						</p>
					) : null}

					{/* Totals strip */}
					<div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-end">
						<div className="flex w-full flex-col items-end gap-2.5 rounded-2xl border bg-card p-4 shadow-sm sm:max-w-xs">
							<div className="flex w-full items-center justify-between gap-4">
								<span className="text-sm text-muted-foreground">Subtotal</span>
								<span className="font-heading text-lg font-bold text-foreground tabular-nums">
									<Money amount={subtotal} />
								</span>
							</div>
							<div className="flex w-full items-center justify-between gap-4">
								<div className="flex items-center gap-2.5">
									<span className="text-sm text-muted-foreground">Tax</span>
									<div className="flex items-center rounded-xl border bg-card px-2 py-1">
										<FormField
											control={form.control}
											name="document.taxRate"
											render={({ field: f }) => (
												<Input
													inputMode="decimal"
													{...f}
													className="h-5 w-12 border-0 bg-transparent p-0 text-center font-mono text-xs font-bold shadow-none focus-visible:ring-0"
													disabled={isPending}
													onChange={(e) => {
														const val = normalizeDecimalInput(e.target.value);
														const parts = val.split(".");
														f.onChange(
															parts[0] +
																(parts.length > 1
																	? "." + parts.slice(1).join("")
																	: ""),
														);
													}}
												/>
											)}
										/>
										<span className="text-[10px] font-bold text-muted-foreground/60">
											%
										</span>
									</div>
								</div>
								<span className="font-heading text-lg font-bold text-foreground tabular-nums">
									<Money amount={taxAmount} />
								</span>
							</div>
							<Separator className="w-full" />
							<div className="flex w-full items-center justify-between gap-4">
								<span className="font-semibold text-foreground">Total</span>
								<span className="zen-teal-glow font-heading text-3xl font-black text-primary tabular-nums">
									<Money amount={totalAmount} />
								</span>
							</div>
						</div>
					</div>
					</div>
				</DocumentSection>

				{/* Notes: laid out as on the document's page */}
				<DocumentSection
					id="notes"
					title="Notes"
					className="animate-slide-up delay-200"
				>
					<FormField
						control={form.control}
						name="document.notes"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<MarkdownEditor
										value={field.value || ""}
										onChange={(e) => field.onChange(e.target.value)}
										placeholder="Add terms, bank details, or internal remarks..."
										disabled={isPending}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
				</DocumentSection>

				{/* Sticky footer */}
				<div className="sticky bottom-[calc(var(--bottom-bar)+1rem)] z-10 flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-md backdrop-blur-sm md:bottom-4">
					<div className="hidden text-xs text-muted-foreground sm:block">
						Dated {issueDate} · valid until {dueDate || "—"}
					</div>
					<div className="ml-auto flex items-center gap-3">
						<Link href={`/b2b/partners/${partner.id}`}>
							<Button
								type="button"
								variant="ghost"
								className="rounded-xl font-semibold"
								disabled={isPending}
							>
								Cancel
							</Button>
						</Link>
						<Button
							type="submit"
							className="zen-glow-teal gap-2 rounded-xl font-black"
							disabled={isPending}
						>
							{isPending ? (
								<Refresh size={18} className="animate-spin" />
							) : (
								<Save2 size={18} variant="Bold" />
							)}
							Create quotation
						</Button>
					</div>
				</div>
			</form>
		</Form>
	);
}

