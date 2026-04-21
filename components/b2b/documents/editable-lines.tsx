"use client";

import { useEffect, useState, useTransition } from "react";
import { useRef } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { updateDocumentLinesAction } from "@/lib/actions/b2b/documents";
import { getB2BPricingTiers } from "@/lib/actions/settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	type B2BDocumentLine,
	type B2BDocumentStatus,
	type B2BPricingTier,
} from "@/lib/types/b2b";
import {
	documentLineSchema,
} from "@/lib/validators";

import { zodResolver } from "@hookform/resolvers/zod";
import { Add, Refresh, Save2, Trash } from "iconsax-reactjs";
import { toast } from "sonner";
import { z } from "zod";

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
}

export function EditableDocumentLines({
	documentId,
	initialLines,
	initialTaxRate,
	status,
}: EditableDocumentLinesProps) {
	const [isPending, startTransition] = useTransition();
	const [pricingTiers, setPricingTiers] = useState<B2BPricingTier[]>([]);
	const isDraft = status === "draft";

	const form = useForm<LinesFormValues>({
		resolver: zodResolver(linesFormSchema),
		defaultValues: {
			lines: initialLines.map((l) => ({
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
		(acc, line) =>
			acc + (Number(line.unitPrice) * Number(line.quantity) || 0),
		0,
	);
	const taxAmount = subtotal * (parseFloat(taxRateWatcher) / 100 || 0);
	const totalAmount = subtotal + taxAmount;


	const handleSave = (values: LinesFormValues) => {

		startTransition(async () => {
			const res = await updateDocumentLinesAction(documentId, {
				lines: values.lines.map((l) => ({
					...l,
					totalPrice: (Number(l.quantity) * Number(l.unitPrice)).toString(),
				})),
				subtotal: subtotal.toString(),
				taxRate: values.taxRate,
				totalAmount: totalAmount.toString(),
			});

			if (res.success) {
				toast.success("Line items updated");
			} else {
				toast.error(res.error || "Failed to update lines");
			}
		});
	};

	if (!isDraft) {
		// Read-only view for non-draft documents (redundant but safe)
		return null;
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
				<div className="flex items-center justify-between">
					<h3 className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
						Line Items
					</h3>
					<div className="flex items-center gap-3">
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
						>
							<Add size={16} variant="Bold" />
							Add Item
						</Button>
						<Button
							type="submit"
							disabled={isPending}
							size="sm"
							className="zen-glow-teal h-8 gap-2 rounded-xl text-xs font-bold"
						>
							{isPending ? (
								<Refresh size={14} className="animate-spin" />
							) : (
								<Save2 size={14} variant="Bold" />
							)}
							Save Items
						</Button>
					</div>
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
								<TableHead className="w-[80px] px-2 text-right">
									Total
								</TableHead>
								<TableHead className="w-[40px] p-0" />
							</TableRow>
						</TableHeader>
						<TableBody className="divide-secondary/15 divide-y">
							{fields.map((field, index) => (
								<TableRow
									key={field.id}
									className="hover:bg-primary/5 border-none transition-colors"
								>
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
															pricingTiers={pricingTiers}
														/>
													</FormControl>
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
													className="focus-visible:ring-primary/20 bg-card h-8 w-full border text-center font-mono text-sm font-bold"
													disabled={isPending}
													onChange={(e) => {
														const val = e.target.value.replace(/[^0-9.]/g, "");
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
														className="focus-visible:ring-primary/20 bg-card h-8 w-full border pr-8 text-center font-mono text-sm font-bold"
														disabled={isPending}
														onChange={(e) => {
															const val = e.target.value.replace(
																/[^0-9.]/g,
																"",
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
									</TableCell>
									<TableCell className="px-2 py-4 text-right align-top">
										<span className="text-foreground font-mono text-sm font-black tabular-nums">
											{(
												(Number(linesWatcher[index]?.quantity) || 0) *
												(Number(linesWatcher[index]?.unitPrice) || 0)
											).toLocaleString()}
											<span className="text-foreground ml-1 text-xs font-normal">
												MAD
											</span>
										</span>
									</TableCell>



									<TableCell className="py-3 text-center align-top">
										<Button
											type="button"
											size="icon"
											className="text-destructive bg-destructive/5 hover:bg-destructive/10 h-8 w-8 cursor-pointer rounded-xl transition-all hover:scale-105 active:scale-90"
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

				<div className="animate-slide-up flex flex-col gap-4 delay-100 sm:flex-row sm:justify-end">
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
										name="taxRate"
										render={({ field: f }) => (
											<Input
												inputMode="decimal"
												{...f}
												className="h-5 w-12 border-0 bg-transparent p-0 text-center font-mono text-xs font-bold shadow-none focus-visible:ring-0"
												disabled={isPending}
												onChange={(e) => {
													const val = e.target.value.replace(/[^0-9.]/g, "");
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
			</form>
		</Form>
	);
}

function DescriptionAutocomplete({
	value,
	onChange,
	onSelectTier,
	pricingTiers,
}: {
	value: string;
	onChange: (val: string) => void;
	onSelectTier: (tier: B2BPricingTier) => void;
	pricingTiers: B2BPricingTier[];
}) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<div ref={containerRef} className="relative w-full">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverAnchor asChild>
					<Input
						value={value}
						onChange={(e) => {
							onChange(e.target.value);
							if (!open && e.target.value) setOpen(true);
						}}
						className="bg-card h-8 border text-sm font-medium"
						placeholder="Description..."
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
