"use client";

import {
	startTransition,
	useActionState,
	useEffect,
	useRef,
	useState,
} from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import {
	createDocumentAction,
	getNextDocumentNumber,
} from "@/actions/b2b-documents";
import { getB2BPricingTiers } from "@/actions/settings";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Textarea } from "@/components/ui/textarea";
import { type B2BContact, type B2BPricingTier } from "@/lib/types";
import { createDocumentWithLinesSchema } from "@/lib/validators";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	Add,
	DocumentText,
	MoneyRecive,
	Refresh,
	Trash,
} from "iconsax-reactjs";
import { toast } from "sonner";
import { z } from "zod";

type CreateDocumentValues = z.infer<typeof createDocumentWithLinesSchema>;

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<span className="text-muted-foreground/70 text-[10px] font-bold tracking-widest uppercase">
			{children}
		</span>
	);
}

function ZenLabel({ children }: { children: React.ReactNode }) {
	return (
		<FormLabel className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
			{children}
		</FormLabel>
	);
}

function DescriptionAutocomplete({
	value,
	onChange,
	onSelectTier,
	pricingTiers,
	isPending,
}: {
	value: string;
	onChange: (val: string) => void;
	onSelectTier: (tier: B2BPricingTier) => void;
	pricingTiers: B2BPricingTier[];
	isPending: boolean;
}) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<div ref={containerRef} className="relative w-full">
			<Popover open={open} onOpenChange={setOpen} modal={false}>
				<PopoverAnchor asChild>
					<Input
						value={value}
						onChange={(e) => {
							onChange(e.target.value);
							if (!open && e.target.value) setOpen(true);
						}}
						onFocus={() => {
							if (pricingTiers.length > 0) setOpen(true);
						}}
						className="placeholder:text-muted-foreground/50 border-foreground/10 focus-visible:ring-primary/20 h-8 bg-white text-sm font-medium transition-all"
						placeholder="Service or product description…"
						disabled={isPending}
					/>
				</PopoverAnchor>
				<PopoverContent
					className="border-foreground/10 overflow-hidden rounded-xl p-0 shadow-2xl"
					style={{ width: "var(--radix-popover-anchor-width)" }}
					onOpenAutoFocus={(e) => e.preventDefault()}
					onInteractOutside={(e) => {
						// Keep open when clicking back on the input/wrapper
						if (containerRef.current?.contains(e.target as Node)) {
							e.preventDefault();
						}
					}}
					align="start"
					sideOffset={4}
				>
					<Command className="bg-white" loop>
						<CommandList className="max-h-56">
							<CommandEmpty className="text-muted-foreground/60 py-4 text-center text-xs font-medium">
								No pricing tiers found.
							</CommandEmpty>
							<CommandGroup
								heading={
									<span className="text-primary px-2 text-xs font-bold tracking-widest uppercase">
										Available Tiers
									</span>
								}
							>
								{pricingTiers
									.filter((tier) =>
										tier.name.toLowerCase().includes(value.toLowerCase()),
									)
									.map((tier) => (
										<CommandItem
											key={tier.id}
											value={tier.name}
											onSelect={() => {
												onSelectTier(tier);
												setOpen(false);
											}}
											className="hover:bg-primary/5 data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary flex cursor-pointer items-center justify-between px-3 py-2 transition-colors"
										>
											<div className="flex flex-col">
												<span className="text-xs font-bold tracking-tight">
													{tier.name}
												</span>
											</div>
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

export function DocumentDialog({
	partnerId,
	contacts,
	children,
}: {
	partnerId: string;
	contacts: B2BContact[];
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const [pricingTiers, setPricingTiers] = useState<B2BPricingTier[]>([]);

	const [state, formAction, isPending] = useActionState(
		createDocumentAction,
		null,
	);

	const [defaultValues] = useState(() => ({
		document: {
			partnerId,
			contactId: contacts.find((c) => c.isPrimary)?.id || contacts[0]?.id || "",
			type: "quote" as const,
			status: "draft" as const,
			documentNumber: "", // Initialized in useEffect
			issueDate: new Date().toISOString().split("T")[0],
			dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
				.toISOString()
				.split("T")[0],
			subtotal: "0",
			taxRate: "0",
			totalAmount: "0",
			notes: "",
		},
		lines: [{ description: "", quantity: 1, unitPrice: 0, totalPrice: 0 }],
	}));

	const form = useForm<CreateDocumentValues>({
		resolver: zodResolver(createDocumentWithLinesSchema),
		defaultValues,
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "lines",
	});

	/* ── Side-effects ─── */
	useEffect(() => {
		if (state?.success) {
			toast.success("Document created successfully");
			startTransition(() => {
				setOpen(false);
				form.reset();
			});
		} else if (state?.error) {
			toast.error(state.error);
		}
	}, [state, form]);

	useEffect(() => {
		if (open) {
			getB2BPricingTiers().then((tiers) => {
				setPricingTiers(tiers as B2BPricingTier[]);
			});

			// Get next sequence number
			getNextDocumentNumber(form.getValues("document.type")).then((num) => {
				form.setValue("document.documentNumber", num);
			});
		}
	}, [open, form]);

	/* ── Totals calculation ─── */
	const linesWatcher = useWatch({
		control: form.control,
		name: "lines",
		defaultValue: defaultValues.lines,
	});
	const taxRateWatcher = useWatch({
		control: form.control,
		name: "document.taxRate",
		defaultValue: defaultValues.document.taxRate,
	});

	useEffect(() => {
		const subtotal = linesWatcher.reduce(
			(acc: number, line: { unitPrice: number; quantity: number }) =>
				acc + line.unitPrice * line.quantity,
			0,
		);
		const tax = subtotal * (parseFloat(taxRateWatcher) / 100 || 0);
		const total = subtotal + tax;

		form.setValue("document.subtotal", subtotal.toString());
		form.setValue("document.totalAmount", total.toString());

		linesWatcher.forEach(
			(
				line: { unitPrice: number; quantity: number; totalPrice: number },
				index: any,
			) => {
				const lineTotal = line.unitPrice * line.quantity;
				if (lineTotal !== line.totalPrice) {
					form.setValue(`lines.${index}.totalPrice`, lineTotal);
				}
			},
		);
	}, [linesWatcher, taxRateWatcher, form]);

	const onSubmit = (values: CreateDocumentValues) => {
		formAction(values);
	};

	/* ── Derived display values ─── */
	const docType = useWatch({ control: form.control, name: "document.type" });
	const subtotalStr = useWatch({
		control: form.control,
		name: "document.subtotal",
	});
	const taxRateStr = useWatch({
		control: form.control,
		name: "document.taxRate",
	});
	const totalAmountStr = useWatch({
		control: form.control,
		name: "document.totalAmount",
	});

	const subtotal = parseFloat(subtotalStr || "0");
	const taxRate = parseFloat(taxRateStr || "0");
	const taxAmount = subtotal * ((taxRate || 0) / 100);
	const totalAmount = parseFloat(totalAmountStr || "0");

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>

			<DialogContent className="bg-card zen-shadow-lg flex max-h-dvh w-full flex-col gap-0 overflow-hidden rounded-t-3xl rounded-b-none border-0 p-0 shadow-2xl sm:max-h-[95vh] sm:min-w-[680px] sm:rounded-3xl md:min-w-[760px]">
				{/* ── Header ── */}
				<DialogHeader className="border-foreground/10 shrink-0 border-b px-4 pt-5 pb-4 sm:px-7 sm:pt-7 sm:pb-5">
					<div className="flex items-start gap-4">
						<div className="border-primary/15 bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm">
							<DocumentText size={22} variant="Bulk" />
						</div>
						<div className="min-w-0 flex-1">
							<DialogTitle className="font-heading text-foreground text-2xl font-medium tracking-tight">
								New Document
							</DialogTitle>
							<DialogDescription className="text-muted-foreground/70 mt-0.5 text-sm">
								Create a quote or invoice for this partner with line items and
								totals.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{/* ── Form ── */}
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex min-h-0 flex-1 flex-col"
					>
						<ScrollArea className="flex-1 px-4 py-5 sm:px-7 sm:py-6">
							<div className="space-y-8">
								<div className="flex w-full flex-col gap-4 sm:flex-row">
									{/* ─── Section 1: Document Identity ───────────────────────────── */}
									<div className="flex w-full flex-col gap-4">
										<div className="flex gap-4">
											{/* Type */}
											<FormField
												control={form.control}
												name="document.type"
												render={({ field }) => (
													<FormItem>
														<ZenLabel>Type</ZenLabel>
														<Select
															defaultValue={field.value}
															disabled={isPending}
															onValueChange={(val: "quote" | "invoice") => {
																field.onChange(val);
																getNextDocumentNumber(val).then((num) => {
																	form.setValue("document.documentNumber", num);
																});
															}}
														>
															<FormControl>
																<SelectTrigger className="border-foreground/10 focus:ring-primary/20 bg-white font-semibold transition-all">
																	<SelectValue placeholder="Select type" />
																</SelectTrigger>
															</FormControl>
															<SelectContent className="border-foreground/10 shadow-xl">
																<SelectItem
																	value="quote"
																	className="font-semibold"
																>
																	Quote
																</SelectItem>
																<SelectItem
																	value="invoice"
																	className="font-semibold"
																>
																	Invoice
																</SelectItem>
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>

											{/* Document # */}
											<FormField
												control={form.control}
												name="document.documentNumber"
												render={({ field }) => (
													<FormItem>
														<ZenLabel>Document #</ZenLabel>
														<FormControl>
															<Input
																{...field}
																className="border-foreground/10 focus-visible:ring-primary/20 bg-white font-mono font-bold tracking-wider transition-all"
																disabled={isPending}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										{/* Contact */}
										<FormField
											control={form.control}
											name="document.contactId"
											render={({ field }) => (
												<FormItem>
													<ZenLabel>Recipient Contact</ZenLabel>
													<Select
														defaultValue={field.value || undefined}
														disabled={isPending}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger className="border-foreground/10 focus:ring-primary/20 w-full bg-white font-semibold transition-all">
																<SelectValue placeholder="Select contact" />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="border-foreground/10 w-full shadow-xl">
															{contacts.map((contact) => (
																<SelectItem
																	key={contact.id}
																	value={contact.id}
																	className="font-semibold"
																>
																	{contact.fullName}{" "}
																	<span className="ml-1 font-normal opacity-40">
																		({contact.role || "No role"})
																	</span>
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									{/* ─── Section 2: Dates ────────────────────────────────────────── */}
									<div className="flex w-full flex-col gap-4">
										<FormField
											control={form.control}
											name="document.issueDate"
											render={({ field }) => (
												<FormItem>
													<ZenLabel>Issue Date</ZenLabel>
													<FormControl>
														<Input
															type="date"
															{...field}
															className="border-foreground/10 focus:ring-primary/20 bg-white font-medium transition-all"
															disabled={isPending}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="document.dueDate"
											render={({ field }) => (
												<FormItem>
													<ZenLabel>Due Date</ZenLabel>
													<FormControl>
														<Input
															type="date"
															{...field}
															value={field.value || ""}
															className="border-foreground/10 focus:ring-primary/20 bg-white font-medium transition-all"
															disabled={isPending}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>

								{/* ─── Section 3: Line Items ────────────────────────────────────── */}
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<SectionLabel>Line Items</SectionLabel>
										<Button
											type="button"
											size="sm"
											className="bg-primary text-primary-foreground zen-glow-teal h-8 cursor-pointer gap-1.5 rounded-xl px-3 text-xs font-bold shadow-sm transition-all hover:brightness-95 active:scale-95"
											disabled={isPending}
											onClick={() =>
												append({
													description: "",
													quantity: 1,
													unitPrice: 0,
													totalPrice: 0,
												})
											}
										>
											<Add size={15} variant="Bold" />
											Add Item
										</Button>
									</div>

									{/* Lines Table */}
									<div className="border-foreground/10 bg-sidebar/45 overflow-hidden rounded-2xl border">
										<div className="overflow-x-auto">
											<Table>
												<TableHeader className="bg-sidebar">
													<TableRow className="border-foreground/10 border-b hover:bg-transparent">
														<TableHead className="text-muted-foreground/70 h-10 px-4 text-[10px] font-bold tracking-widest uppercase">
															Description
														</TableHead>
														<TableHead className="text-muted-foreground/70 h-10 w-[72px] px-2 text-center text-[10px] font-bold tracking-widest uppercase">
															Qty
														</TableHead>
														<TableHead className="text-muted-foreground/70 h-10 w-[104px] px-2 text-center text-[10px] font-bold tracking-widest uppercase">
															Unit Price
														</TableHead>
														<TableHead className="text-muted-foreground/70 h-10 w-[80px] px-2 text-right text-[10px] font-bold tracking-widest uppercase">
															Total
														</TableHead>
														<TableHead className="h-10 w-[40px] p-0" />
													</TableRow>
												</TableHeader>
												<TableBody className="divide-secondary/15 divide-y">
													{fields.map((field, index) => (
														<TableRow
															key={field.id}
															className="hover:bg-secondary/5 border-none transition-colors"
														>
															{/* Description Autocomplete */}
															<TableCell className="px-4 py-3 align-top">
																<FormField
																	control={form.control}
																	name={`lines.${index}.description`}
																	render={({ field: f }) => (
																		<FormItem className="space-y-1">
																			<FormControl>
																				<DescriptionAutocomplete
																					value={f.value}
																					onChange={f.onChange}
																					onSelectTier={(tier) => {
																						form.setValue(
																							`lines.${index}.description`,
																							tier.name,
																						);
																						form.setValue(
																							`lines.${index}.unitPrice`,
																							tier.price,
																						);
																					}}
																					pricingTiers={pricingTiers}
																					isPending={isPending}
																				/>
																			</FormControl>
																			<FormMessage className="text-[10px]" />
																		</FormItem>
																	)}
																/>
															</TableCell>

															{/* Quantity */}
															<TableCell className="px-2 py-3 align-top">
																<FormField
																	control={form.control}
																	name={`lines.${index}.quantity`}
																	render={({ field: f }) => (
																		<FormItem className="space-y-0">
																			<FormControl>
																				<Input
																					type="number"
																					{...f}
																					className="border-foreground/10 focus-visible:ring-primary/20 h-8 w-full bg-white text-center font-mono text-sm font-bold"
																					disabled={isPending}
																					onChange={(e) =>
																						f.onChange(
																							parseFloat(e.target.value) || 0,
																						)
																					}
																				/>
																			</FormControl>
																		</FormItem>
																	)}
																/>
															</TableCell>

															{/* Unit Price */}
															<TableCell className="px-2 py-3 align-top">
																<FormField
																	control={form.control}
																	name={`lines.${index}.unitPrice`}
																	render={({ field: f }) => (
																		<FormItem className="space-y-0">
																			<FormControl>
																				<Input
																					type="number"
																					{...f}
																					className="border-foreground/10 focus-visible:ring-primary/20 h-8 w-full bg-white text-center font-mono text-sm font-bold"
																					disabled={isPending}
																					onChange={(e) =>
																						f.onChange(
																							parseFloat(e.target.value) || 0,
																						)
																					}
																				/>
																			</FormControl>
																		</FormItem>
																	)}
																/>
															</TableCell>

															{/* Line Total */}
															<TableCell className="px-2 py-4 text-right align-top">
																<span className="text-foreground font-mono text-sm font-black tabular-nums">
																	{(
																		linesWatcher[index]?.quantity *
																			linesWatcher[index]?.unitPrice || 0
																	).toLocaleString()}
																	<span className="text-muted-foreground ml-1 text-xs font-normal">
																		MAD
																	</span>
																</span>
															</TableCell>

															{/* Remove */}
															<TableCell className="p-0 py-3 text-center align-top">
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	className="text-destructive hover:bg-destructive/10 h-8 w-8 cursor-pointer rounded-xl transition-all active:scale-90"
																	disabled={fields.length === 1 || isPending}
																	onClick={() => remove(index)}
																>
																	<Trash size={15} variant="Bold" />
																</Button>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
									</div>
								</div>

								<div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
									{/* ─── Section 4: Notes & Totals ──────────────────────────────── */}
									<div className="flex h-full w-full flex-col gap-4 sm:w-1/2">
										<SectionLabel>Notes &amp; Comments</SectionLabel>
										<FormField
											control={form.control}
											name="document.notes"
											render={({ field }) => (
												<FormItem className="h-full">
													<FormControl>
														<Textarea
															{...field}
															className="border-foreground/10 focus-visible:ring-primary/20 min-h-32 resize-none rounded-2xl bg-white px-4 py-3 font-medium transition-all"
															placeholder="Optional notes (will appear on the document)…"
															disabled={isPending}
															value={field.value || ""}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									{/* Totals */}
									<div className="border-foreground/10 bg-secondary/5 flex w-full flex-col items-end gap-2.5 rounded-2xl border p-4 sm:w-1/2">
										{/* Subtotal Row */}
										<div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end sm:gap-16">
											<SectionLabel>Subtotal</SectionLabel>
											<span className="font-heading text-foreground text-lg font-bold tabular-nums">
												{subtotal.toLocaleString()}
												<span className="text-muted-foreground ml-1 text-xs font-normal">
													MAD
												</span>
											</span>
										</div>

										{/* Tax Rate Row */}
										<div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end sm:gap-16">
											<div className="flex items-center gap-2.5">
												<SectionLabel>Tax Rate</SectionLabel>
												<div className="border-foreground/10 flex items-center rounded-xl border bg-white px-2 py-1">
													<Input
														type="number"
														{...form.register("document.taxRate")}
														className="h-5 w-12 border-0 bg-transparent p-0 text-center font-mono text-xs font-bold shadow-none focus-visible:ring-0"
														disabled={isPending}
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

										<Separator className="max-w-72 self-end" />

										{/* Total Row */}
										<div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end sm:gap-10">
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

								{/* ─── Section 5: Notes ────────────────────────────────────────── */}
							</div>
						</ScrollArea>

						{/* ── Footer ── */}
						<DialogFooter className="border-foreground/10 bg-card shrink-0 flex-col-reverse gap-2 border-t px-4 py-4 sm:flex-row sm:gap-0 sm:px-7">
							<Button
								type="button"
								variant="ghost"
								className="hover:bg-secondary/50 hover:text-foreground/80 w-full rounded-xl px-6 font-semibold transition-all sm:w-auto"
								disabled={isPending}
								onClick={() => setOpen(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								className="zen-glow-teal w-full gap-2.5 rounded-xl px-8 font-black transition-all hover:scale-[1.02] hover:brightness-105 active:scale-95 sm:w-auto"
								disabled={isPending}
							>
								{isPending ? (
									<Refresh size={18} className="animate-spin" />
								) : (
									<MoneyRecive size={18} variant="Bold" />
								)}
								Create {docType === "quote" ? "Quote" : "Invoice"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
