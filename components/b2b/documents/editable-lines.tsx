"use client";

import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { updateDocumentLinesAction } from "@/lib/actions/b2b/documents";
import { getB2BPricingTiers } from "@/lib/actions/settings";
import { mergeSameLines } from "@/lib/domain/billing/same-lines";
import {
	type B2BDocumentLine,
	type B2BDocumentStatus,
	type B2BPricingTier,
} from "@/lib/types/b2b";
import { formatAmount,normalizeDecimalInput } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/ui";
import { documentLineSchema, withoutBlankLines } from "@/lib/validators";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "iconsax-reactjs";
import { z } from "zod";

import { DescriptionAutocomplete } from "./description-autocomplete";
import { DocumentSection } from "./document-section";
import { cellProps, focusCell, useFluidLines } from "./fluid-lines";
import { phoneLine } from "./phone-line";
import { SaveStatus, useAutosave } from "./use-autosave";

const linesFormSchema = z.object({
	lines: z.array(documentLineSchema).min(1),
	taxRate: z.string(),
});

type LinesFormValues = z.infer<typeof linesFormSchema>;

interface EditableDocumentLinesProps {
	documentId: string;
	initialLines: B2BDocumentLine[];
	initialTaxRate: string;
	status: B2BDocumentStatus;
	/** An invoice from a quotation keeps the quotation's tax. */
	taxLocked?: boolean;
}

export function EditableDocumentLines({
	documentId,
	initialLines,
	initialTaxRate,
	status,
	taxLocked = false,
}: EditableDocumentLinesProps) {
	const [pricingTiers, setPricingTiers] = useState<B2BPricingTier[]>([]);
	const isDraft = status === "draft";

	const form = useForm<LinesFormValues>({
		resolver: zodResolver(linesFormSchema),
		defaultValues: {
			lines: initialLines.map((l) => ({
				sourceLineId: l.sourceLineId,
				description: l.description,
				quantity: String(l.quantity),
				unitPrice: String(l.unitPrice),
				totalPrice: String(l.totalPrice),
			})),
			taxRate: initialTaxRate,
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "lines",
	});

	useEffect(() => {
		if (isDraft) {
			getB2BPricingTiers().then((tiers) =>
				setPricingTiers(tiers as B2BPricingTier[]),
			);
		}
	}, [isDraft]);

	const linesWatcher = useWatch({ control: form.control, name: "lines" });
	const taxRateWatcher = useWatch({ control: form.control, name: "taxRate" });

	const subtotal = linesWatcher.reduce(
		(acc, line) => acc + (Number(line.unitPrice) * Number(line.quantity) || 0),
		0,
	);
	const taxAmount = subtotal * (parseFloat(taxRateWatcher) / 100 || 0);
	const totalAmount = subtotal + taxAmount;

	const { isWaiting, removeLine, keyDown, mergeLine, leaveLine, grownId, announcement } = useFluidLines({
		count: fields.length,
		lines: linesWatcher,
		ids: fields.map((field) => field.id),
		getLines: () => form.getValues("lines"),
		setQuantity: (index, quantity) =>
			form.setValue(`lines.${index}.quantity`, quantity, { shouldDirty: true }),
		append,
		remove,
	});

	const withTotals = (lines: LinesFormValues["lines"]) =>
		lines.map((l) => ({
			...l,
			sourceLineId: l.sourceLineId,
			totalPrice: (Number(l.quantity) * Number(l.unitPrice)).toString(),
		}));
	// What the server gets: each item once, even while the cursor is still in
	// a repeat (the table merges it when she leaves the line). Compared with
	// what was last saved, so the empty line appearing (or a change undone)
	// doesn't send the same lines again.
	const payloadOf = (values: LinesFormValues) => ({
		lines: withTotals(mergeSameLines(withoutBlankLines(values.lines))),
		taxRate: values.taxRate,
	});
	const lastSaved = useRef(JSON.stringify(payloadOf(form.getValues())));

	// The lines save themselves as she types: no "Save" to remember.
	const { state, changed, retry } = useAutosave(
		async () => {
			const values = form.getValues();
			const payload = payloadOf(values);
			if (!payload.lines.length)
				return { ok: false, invalid: true, message: "add at least one line" };
			// Checked as she sees them (before merging), so "line 3" is her line 3.
			const check = linesFormSchema.safeParse({
				lines: withTotals(withoutBlankLines(values.lines)),
				taxRate: values.taxRate,
			});
			if (!check.success) {
				const issue = check.error.issues[0];
				const kept = values.lines
					.map((line, i) => ({ line, i }))
					.filter(({ line }) => withoutBlankLines([line]).length);
				const row =
					typeof issue.path[1] === "number"
						? (kept[issue.path[1]]?.i ?? 0) + 1
						: null;
				const field = issue.path[2];
				const message =
					field === "description"
						? `line ${row} needs a description`
						: field === "quantity"
							? `line ${row} needs a quantity`
							: field === "unitPrice"
								? `line ${row} needs a price`
								: issue.message.toLowerCase();
				return { ok: false, invalid: true, message };
			}
			const key = JSON.stringify(payload);
			if (key === lastSaved.current) return { ok: true };
			const res = await updateDocumentLinesAction(documentId, payload);
			if (!res.success)
				return {
					ok: false,
					// A refusal (no error code: "“Séance hôtel”: 5 left to
					// invoice…") is hers to fix; a failure can be retried.
					invalid: !!res.error && !res.ref,
					message: (res.error ?? "Couldn't reach the server").replace(/\.$/, ""),
				};
			lastSaved.current = key;
			return { ok: true };
		},
		{ id: "lines", label: "Line items" },
	);

	useEffect(() => {
		const subscription = form.watch(() => changed());
		return () => subscription.unsubscribe();
	}, [form, changed]);

	if (!isDraft) {
		// Read-only view for non-draft documents (redundant but safe)
		return null;
	}

	return (
		<Form {...form}>
			<DocumentSection
				id="line-items"
				title="Line items"
				// No "Add" button: an empty line always waits at the end of the table.
				aside={<SaveStatus state={state} retry={retry} />}
			>
				<form
					onSubmit={(event) => event.preventDefault()}
					className="space-y-6"
				>
					<p aria-live="polite" className="sr-only">
						{announcement}
					</p>
					<div className="overflow-x-auto">
						<Table className={phoneLine.table}>
							<TableHeader className={phoneLine.head}>
								<TableRow className="border-b transition-colors hover:bg-transparent">
									<TableHead className="px-4">Description</TableHead>
									<TableHead className="w-[72px] px-2 text-center">
										Qty
									</TableHead>
									<TableHead className="w-[104px] px-2 text-center">
										Unit Price
									</TableHead>
									<TableHead className="w-[80px] px-2 text-right">
										Total
									</TableHead>
									<TableHead className="w-[40px] p-0" />
								</TableRow>
							</TableHeader>
							<TableBody className={cn("divide-secondary/15 divide-y", phoneLine.body)}>
								{fields.map((field, index) => {
									const waiting = isWaiting(index);
									return (
										<TableRow
											key={field.id}
											onBlur={leaveLine(index)}
											className={cn(
												"hover:bg-primary/5 border-none transition-colors duration-500",
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
																	onChange={f.onChange}
																	placeholder={
																		waiting ? "Add a line…" : "Description…"
																	}
																	inputProps={{
																		"aria-label": waiting
																			? "Add a line"
																			: `Description, line ${index + 1}`,
																		onKeyDown: keyDown(index, "description"),
																		...cellProps(index, "description"),
																	}}
																	inputClassName={cn(phoneLine.input, waiting && "border-dashed")}
																	onSelectTier={(tier) => {
																		const picked = {
																			description: tier.name,
																			unitPrice: tier.price.toString(),
																		};
																		// Already on the quotation: that line's quantity grows.
																		const into = mergeLine(index, picked);
																		if (into < 0) {
																			form.setValue(`lines.${index}.description`, picked.description, { shouldDirty: true });
																			form.setValue(`lines.${index}.unitPrice`, picked.unitPrice, { shouldDirty: true });
																		}
																		setTimeout(() => focusCell(into < 0 ? index : into, "quantity"));
																	}}
																	pricingTiers={pricingTiers}
																/>
															</FormControl>
														</FormItem>
													)}
												/>
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
																onFocus={(event) =>
																	event.currentTarget.select()
																}
																{...cellProps(index, "quantity")}
																{...f}
																value={f.value ?? ""}
																className={cn("focus-visible:ring-primary/20 bg-card h-8 w-full border text-center font-mono text-sm font-bold", phoneLine.input)}
																onChange={(e) => {
																	const val = normalizeDecimalInput(
																		e.target.value,
																	);
																	const parts = val.split(".");
																	const sanitized =
																		parts[0] +
																		(parts.length > 1
																			? "." + parts.slice(1).join("")
																			: "");
																	f.onChange(sanitized);
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
																	onFocus={(event) =>
																		event.currentTarget.select()
																	}
																	{...cellProps(index, "unitPrice")}
																	{...f}
																	value={f.value ?? ""}
																	className={cn("focus-visible:ring-primary/20 bg-card h-8 w-full border pr-8 text-center font-mono text-sm font-bold", phoneLine.input)}
																	onChange={(e) => {
																		// A French comma is the decimal mark ("450,50"), not dropped.
																		const val = normalizeDecimalInput(
																			e.target.value,
																		);
																		const parts = val.split(".");
																		const sanitized =
																			parts[0] +
																			(parts.length > 1
																				? "." + parts.slice(1).join("")
																				: "");
																		f.onChange(sanitized);
																	}}
																/>
																<span className="text-muted-foreground/40 absolute top-1/2 right-2 -translate-y-1/2 text-[9px] font-bold">
																	MAD
																</span>
															</div>
														)}
													/>
												)}
											</TableCell>
											<TableCell className={cn("px-2 py-4 text-right align-top", phoneLine.cell)}>
												{waiting ? null : (
													<span className="text-foreground font-mono text-sm font-black tabular-nums">
														{formatAmount((Number(linesWatcher[index]?.quantity) || 0) *
															(Number(linesWatcher[index]?.unitPrice) || 0))}
														<span className="text-foreground ml-1 text-xs font-normal">
															MAD
														</span>
													</span>
												)}
											</TableCell>

											<TableCell className={cn("py-3 text-center align-top", phoneLine.cell)}>
												{waiting ? null : (
													<Button
														type="button"
														size="icon"
														aria-label={`Remove line ${index + 1}`}
														className={cn("text-destructive bg-destructive/5 hover:bg-destructive/10 h-8 w-8 cursor-pointer rounded-xl transition-all hover:scale-105 active:scale-90", phoneLine.remove)}
														onClick={() => removeLine(index)}
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

					<div className="animate-slide-up flex flex-col gap-4 delay-100 sm:flex-row sm:justify-end">
						<div className="bg-card flex w-full flex-col items-end gap-2.5 rounded-2xl border p-4 shadow-sm sm:max-w-xs">
							<div className="flex w-full items-center justify-between gap-4">
								<span className="text-muted-foreground/70 text-[10px] font-bold tracking-widest uppercase">
									Subtotal
								</span>
								<span className="font-heading text-foreground text-lg font-bold tabular-nums">
									{formatAmount(subtotal)}
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
											name="taxRate"
											render={({ field: f }) => (
												<Input
													inputMode="decimal"
													{...f}
													readOnly={taxLocked}
													title={taxLocked ? "The quotation's tax" : undefined}
													aria-label="Tax rate"
													className="h-5 w-12 border-0 bg-transparent p-0 text-center font-mono text-xs font-bold shadow-none focus-visible:ring-0"

													onChange={(e) => {
														const val = normalizeDecimalInput(e.target.value);
														const parts = val.split(".");
														const sanitized =
															parts[0] +
															(parts.length > 1
																? "." + parts.slice(1).join("")
																: "");
														f.onChange(sanitized);
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
									{formatAmount(taxAmount)}
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
									{formatAmount(totalAmount)}
									<span className="text-primary ml-1.5 text-sm font-semibold">
										MAD
									</span>
								</span>
							</div>
						</div>
					</div>
				</form>
			</DocumentSection>
		</Form>
	);
}
