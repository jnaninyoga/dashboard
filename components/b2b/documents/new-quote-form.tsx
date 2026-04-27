"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
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
	Popover,
	PopoverAnchor,
	PopoverContent,
} from "@/components/ui/popover";
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
import { getB2BPricingTiers } from "@/lib/actions/settings";
import {
	type B2BContact,
	type B2BPartner,
	type B2BPricingTier,
} from "@/lib/types/b2b";
import { createDocumentWithLinesSchema } from "@/lib/validators/document";

import {
	Add,
	ArrowLeft,
	Buildings,
	Calendar,
	DocumentText,
	Edit2,
	MoneyTime,
	NoteText,
	Refresh,
	Save2,
	Trash,
} from "iconsax-reactjs";
import { toast } from "sonner";
import { type z } from "zod";

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
	const [pricingTiers, setPricingTiers] = useState<B2BPricingTier[]>([]);
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
				contactId:
					contacts.find((c) => c.isPrimary)?.id || contacts[0]?.id || "",
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
			lines: [{ description: "", quantity: "1", unitPrice: "0", totalPrice: "0" }],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "lines",
	});

	useEffect(() => {
		getB2BPricingTiers().then((tiers) =>
			setPricingTiers(tiers as B2BPricingTier[]),
		);
	}, []);

	useEffect(() => {
		if (!state || handledStateRef.current === state) return;
		handledStateRef.current = state;
		if (state.success && state.id) {
			toast.success("Quote created");
			router.push(`/b2b/documents/${state.id}`);
		} else if (state.error) {
			toast.error(state.error);
		}
	}, [state, router]);

	const linesWatcher = useWatch({ control: form.control, name: "lines" });
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

	const onSubmit = (values: CreateValues) => {
		// Server recomputes totals from lines + taxRate; we still send sane
		// strings so the existing validator passes.
		formAction({
			...values,
			document: {
				...values.document,
				subtotal: subtotal.toFixed(2),
				totalAmount: totalAmount.toFixed(2),
			},
		});
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-col gap-6"
			>
				{/* Breadcrumb */}
				<Link
					href={`/b2b/partners/${partner.id}`}
					className="group text-muted-foreground hover:text-primary flex w-fit items-center gap-2 text-sm transition-colors"
				>
					<ArrowLeft
						size={16}
						className="transition-transform group-hover:-translate-x-1"
					/>
					Back to {partner.companyName}
				</Link>

				{/* Hero card — mirrors the detail page so create / view share one mental model */}
				<div className="animate-slide-up border-secondary/20 bg-card relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border p-8 shadow-sm md:flex-row">
					<div className="text-primary absolute -top-10 right-0 p-8 opacity-5">
						<DocumentText size={240} variant="Bulk" />
					</div>

					<div className="relative z-10 flex flex-col gap-6">
						<div className="flex items-center gap-4">
							<div className="border-primary/20 bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl border shadow-inner">
								<DocumentText size={28} variant="Bulk" />
							</div>
							<div className="space-y-1">
								<div className="flex items-center gap-3">
									<h1 className="font-heading text-foreground text-3xl font-black tracking-tight">
										{previewNumber}
									</h1>
									<Badge
										variant="muted"
										className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase"
									>
										<Edit2 size={14} variant="Bold" /> Draft
									</Badge>
								</div>
								<p className="text-muted-foreground/60 text-xs font-bold tracking-wider uppercase">
									New B2B Quotation
								</p>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
							<div className="flex items-center gap-3">
								<div className="bg-secondary/40 text-secondary-3 flex size-10 items-center justify-center rounded-xl">
									<Buildings size={20} variant="Bulk" />
								</div>
								<div className="flex min-w-0 flex-col">
									<span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-50">
										Partner
									</span>
									<span className="text-foreground truncate text-sm font-bold">
										{partner.companyName}
									</span>
								</div>
							</div>

							<FormField
								control={form.control}
								name="document.issueDate"
								render={({ field }) => (
									<FormItem className="flex items-center gap-3 space-y-0">
										<div className="bg-secondary/40 text-secondary-3 flex size-10 items-center justify-center rounded-xl">
											<Calendar size={20} variant="Bulk" />
										</div>
										<div className="flex flex-col">
											<FormLabel className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-50">
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
										<div className="bg-secondary/40 text-secondary-3 flex size-10 items-center justify-center rounded-xl">
											<MoneyTime size={20} variant="Bulk" />
										</div>
										<div className="flex flex-col">
											<FormLabel className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-50">
												Due Date
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
									<FormLabel className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-50">
										Recipient contact
									</FormLabel>
									<Select
										value={field.value ?? ""}
										disabled={isPending}
										onValueChange={(val) =>
											field.onChange(val === "" ? null : val)
										}
									>
										<FormControl>
											<SelectTrigger className="bg-card w-full max-w-sm border font-semibold">
												<SelectValue placeholder="Select contact" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{contacts.length > 0 ? (
												contacts.map((c) => (
													<SelectItem
														key={c.id}
														value={c.id}
														className="font-semibold"
													>
														<span>{c.fullName}</span>
														{c.role ? (
															<span className="text-[10px] opacity-50">
																{" "}
																· {c.role}
															</span>
														) : null}
														{c.isPrimary ? (
															<span className="bg-primary/10 text-primary ml-2 rounded-full px-1.5 py-0.5 text-[9px] uppercase">
																Primary
															</span>
														) : null}
													</SelectItem>
												))
											) : (
												<div className="text-muted-foreground p-4 text-center text-xs">
													Add a contact to this partner first.
												</div>
											)}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</div>

				{/* Lines */}
				<div className="animate-slide-up p-6 delay-100">
					<div className="mb-4 flex items-center justify-between">
						<h3 className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
							Line Items
						</h3>
						<Button
							type="button"
							size="sm"
							variant="outline"
							className="h-8 gap-1.5 rounded-xl text-xs font-bold"
							onClick={() =>
								append({
									description: "",
									quantity: "1",
									unitPrice: "0",
									totalPrice: "0",
								})
							}
							disabled={isPending}
						>
							<Add size={16} variant="Bold" />
							Add Item
						</Button>
					</div>

					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
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
							<TableBody className="divide-secondary/15 divide-y">
								{fields.map((field, index) => (
									<TableRow key={field.id} className="hover:bg-primary/5 border-none">
										<TableCell className="px-4 py-3 align-top">
											<FormField
												control={form.control}
												name={`lines.${index}.description`}
												render={({ field: f }) => (
													<FormItem className="space-y-0">
														<FormControl>
															<DescriptionAutocomplete
																value={f.value}
																onChange={f.onChange}
																disabled={isPending}
																pricingTiers={pricingTiers}
																onSelectTier={(tier) => {
																	form.setValue(
																		`lines.${index}.description`,
																		tier.name,
																	);
																	form.setValue(
																		`lines.${index}.unitPrice`,
																		tier.price.toString(),
																	);
																}}
															/>
														</FormControl>
														<FormMessage className="text-[10px]" />
													</FormItem>
												)}
											/>
										</TableCell>
										<TableCell className="px-2 py-3 align-top">
											<FormField
												control={form.control}
												name={`lines.${index}.quantity`}
												render={({ field: f }) => (
													<Input
														inputMode="decimal"
														{...f}
														value={f.value ?? ""}
														className="bg-card h-8 w-full border text-center font-mono text-sm font-bold"
														disabled={isPending}
														onChange={(e) => {
															const val = e.target.value.replace(/[^0-9.]/g, "");
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
										</TableCell>
										<TableCell className="px-2 py-3 align-top">
											<FormField
												control={form.control}
												name={`lines.${index}.unitPrice`}
												render={({ field: f }) => (
													<div className="relative">
														<Input
															inputMode="decimal"
															{...f}
															value={f.value ?? ""}
															className="bg-card h-8 w-full border pr-8 text-center font-mono text-sm font-bold"
															disabled={isPending}
															onChange={(e) => {
																const val = e.target.value.replace(/[^0-9.]/g, "");
																const parts = val.split(".");
																f.onChange(
																	parts[0] +
																		(parts.length > 1
																			? "." + parts.slice(1).join("")
																			: ""),
																);
															}}
														/>
														<span className="text-muted-foreground/40 absolute top-1/2 right-2 -translate-y-1/2 text-[9px] font-bold">
															MAD
														</span>
													</div>
												)}
											/>
										</TableCell>
										<TableCell className="px-2 py-4 text-right align-top">
											<span className="text-foreground font-mono text-sm font-black tabular-nums">
												{(
													(Number(linesWatcher[index]?.quantity) || 0) *
													(Number(linesWatcher[index]?.unitPrice) || 0)
												).toLocaleString()}
												<span className="text-muted-foreground ml-1 text-xs font-normal">
													MAD
												</span>
											</span>
										</TableCell>
										<TableCell className="py-3 text-center align-top">
											<Button
												type="button"
												size="icon"
												variant="ghost"
												className="text-destructive hover:bg-destructive/10 h-8 w-8 rounded-xl"
												onClick={() => remove(index)}
												disabled={fields.length === 1 || isPending}
											>
												<Trash size={15} variant="Bold" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{/* Totals strip */}
					<div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-end">
						<div className="bg-card flex w-full flex-col items-end gap-2.5 rounded-2xl border p-4 shadow-sm sm:max-w-xs">
							<div className="flex w-full items-center justify-between gap-4">
								<span className="text-muted-foreground/70 text-[10px] font-bold tracking-widest uppercase">
									Subtotal
								</span>
								<span className="font-heading text-foreground text-lg font-bold tabular-nums">
									{subtotal.toLocaleString()}
									<span className="text-muted-foreground ml-1 text-xs font-normal">
										MAD
									</span>
								</span>
							</div>
							<div className="flex w-full items-center justify-between gap-4">
								<div className="flex items-center gap-2.5">
									<span className="text-muted-foreground/70 text-[10px] font-bold tracking-widest uppercase">
										Tax Rate
									</span>
									<div className="bg-card flex items-center rounded-xl border px-2 py-1">
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
														const val = e.target.value.replace(/[^0-9.]/g, "");
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
										<span className="text-muted-foreground/60 text-[10px] font-bold">
											%
										</span>
									</div>
								</div>
								<span className="font-heading text-foreground text-lg font-bold tabular-nums">
									{taxAmount.toLocaleString(undefined, {
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
									Total Amount
								</span>
								<span className="font-heading text-primary zen-teal-glow text-3xl font-black tabular-nums">
									{totalAmount.toLocaleString()}
									<span className="text-primary ml-1.5 text-sm font-semibold">
										MAD
									</span>
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Notes — same card + MarkdownEditor as the document detail page */}
				<div className="animate-slide-up bg-card rounded-3xl border p-6 shadow-sm delay-200">
					<div className="mb-4 flex h-10 items-center gap-2">
						<NoteText size={20} className="text-primary" variant="Bulk" />
						<h3 className="text-primary text-sm font-bold tracking-widest uppercase">
							Notes
						</h3>
					</div>
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
										className="border-secondary/10"
									/>
								</FormControl>
							</FormItem>
						)}
					/>
				</div>

				{/* Sticky footer */}
				<div className="bg-card sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-md backdrop-blur-sm">
					<div className="text-muted-foreground hidden text-xs sm:block">
						Issuing on {issueDate} · due {dueDate || "—"}
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
							disabled={isPending || contacts.length === 0}
						>
							{isPending ? (
								<Refresh size={18} className="animate-spin" />
							) : (
								<Save2 size={18} variant="Bold" />
							)}
							Create Quote
						</Button>
					</div>
				</div>
			</form>
		</Form>
	);
}

function DescriptionAutocomplete({
	value,
	onChange,
	onSelectTier,
	pricingTiers,
	disabled,
}: {
	value: string;
	onChange: (val: string) => void;
	onSelectTier: (tier: B2BPricingTier) => void;
	pricingTiers: B2BPricingTier[];
	disabled?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<div ref={containerRef} className="relative w-full">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverAnchor asChild>
					<Input
						value={value}
						onFocus={() => setOpen(true)}
						onChange={(e) => {
							onChange(e.target.value);
							if (!open) setOpen(true);
						}}
						disabled={disabled}
						className="bg-card h-8 border text-sm font-medium"
						placeholder="Description…"
					/>
				</PopoverAnchor>
				<PopoverContent
					className="border p-0"
					style={{ width: "var(--radix-popover-anchor-width)" }}
					onOpenAutoFocus={(e) => e.preventDefault()}
				>
					<Command className="bg-card">
						<CommandList className="max-h-48">
							<CommandEmpty>No results.</CommandEmpty>
							<CommandGroup>
								{pricingTiers
									.filter((t) =>
										t.name.toLowerCase().includes(value.toLowerCase()),
									)
									.map((tier) => (
										<CommandItem
											key={tier.id}
											value={tier.name}
											onSelect={() => {
												onSelectTier(tier);
												setOpen(false);
											}}
											className="hover:bg-primary/5 flex cursor-pointer items-center justify-between px-3 py-2"
										>
											<span className="text-xs font-bold tracking-tight">
												{tier.name}
											</span>
											<Badge
												variant="outline"
												className="bg-accent/20 text-primary border-primary/10 ml-2 font-mono text-[10px] font-black"
											>
												{tier.price.toLocaleString()} MAD
											</Badge>
										</CommandItem>
									))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}
