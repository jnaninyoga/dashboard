"use client";

import { useEffect, useId, useTransition } from "react";
import { type FieldPath, useForm, useWatch } from "react-hook-form";

import { FormSheet } from "@/components/form-sheet";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { saveProductAction } from "@/lib/actions/price-list";
import { productLabel } from "@/lib/domain/price-list/product";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { type Product, type ProductKind } from "@/lib/types";
import { CURRENCY, parseAmountInput } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/ui";
import { type ProductFormInput, type ProductFormValues, productSchema } from "@/lib/validators";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card, Edit2, Refresh as Loader2, Tag2 } from "iconsax-reactjs";

const WORDS: Record<ProductKind, { noun: string; icon: React.ReactNode; intro: string; placeholder: string }> = {
	membership: {
		noun: "membership",
		icon: <Card size={28} variant="Bulk" />,
		intro: "A card you sell to clients: a credit for each visit, for a number of months.",
		placeholder: "Pass 10 séances",
	},
	partner_service: {
		noun: "partner rate",
		icon: <Tag2 size={28} variant="Bulk" />,
		intro: "What you charge a hotel or partner for one session, for a group of a given size.",
		placeholder: "Famille",
	},
};

const blank = (value: number | null | undefined) => (value == null ? "" : String(value));

function defaultsFor(kind: ProductKind, product?: Product): ProductFormInput {
	// "450", "500.50": whole prices without cents, the others with both digits.
	const amount = Number(product?.price);
	const price = product ? (Number.isInteger(amount) ? String(amount) : amount.toFixed(2)) : "";
	return kind === "membership"
		? { kind, name: product?.name ?? "", price, credits: blank(product?.credits ?? 10), durationMonths: blank(product?.durationMonths ?? 1) }
		: { kind, name: product?.name ?? "", price, groupMin: blank(product?.groupMin), groupMax: blank(product?.groupMax) };
}

/** A field that holds what she types: decimals with a French comma, or whole numbers. */
function NumberField({
	name,
	label,
	suffix,
	whole,
	placeholder,
	description,
	className,
}: {
	name: FieldPath<ProductFormInput>;
	label: string;
	suffix?: string;
	whole?: boolean;
	placeholder?: string;
	description?: React.ReactNode;
	className?: string;
}) {
	return (
		<FormField
			name={name}
			render={({ field }) => (
				<FormItem className={className}>
					<FormLabel>{label}</FormLabel>
					<div className="relative">
						<FormControl>
							<Input
								inputMode={whole ? "numeric" : "decimal"}
								placeholder={placeholder}
								{...field}
								value={field.value ?? ""}
								onChange={(event) => {
									const raw = event.target.value;
									field.onChange(whole ? raw.replace(/\D/g, "") : raw.replace(/[^\d.,]/g, ""));
								}}
								className={cn("tabular-nums", suffix && "pr-14")}
							/>
						</FormControl>
						{suffix ? (
							<span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
								{suffix}
							</span>
						) : null}
					</div>
					{description ? <FormDescription>{description}</FormDescription> : null}
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

/**
 * Adds to her price list, or changes what's on it: a membership card, or a
 * rate for partners. While she writes a partner rate, it shows how it will
 * read on a quotation. Changes apply to what she sells from now on.
 */
export function ProductSheet({
	kind,
	product,
	open,
	onOpenChange,
	trigger,
}: {
	kind: ProductKind;
	/** Edit mode: the product to change. */
	product?: Product;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	trigger?: React.ReactNode;
}) {
	const formId = useId();
	const [pending, startTransition] = useTransition();
	const words = WORDS[kind];
	const editing = !!product;

	const form = useForm<ProductFormInput, unknown, ProductFormValues>({
		resolver: zodResolver(productSchema),
		defaultValues: defaultsFor(kind, product),
	});

	// Each open starts from the saved values, not from a discarded edit.
	useEffect(() => {
		if (open) form.reset(defaultsFor(kind, product));
	}, [open, kind, product, form]);

	const watched = useWatch({ control: form.control });
	const count = (value: unknown) => (String(value ?? "").trim() ? Number(value) : null);
	const preview =
		kind === "partner_service"
			? productLabel({
					name: String(watched.name ?? "").trim() || words.placeholder,
					groupMin: count(watched.kind === "partner_service" ? watched.groupMin : null),
					groupMax: count(watched.kind === "partner_service" ? watched.groupMax : null),
				})
			: null;
	const previewPrice = parseAmountInput(String(watched.price ?? ""));

	const onSubmit = (values: ProductFormValues) =>
		startTransition(async () => {
			const result = await saveProductAction(product?.id ?? null, values);
			if (result.success) {
				notify.success(editing ? "Saved" : `Added to your price list`);
				onOpenChange(false);
			} else {
				notifyActionError(result, "Couldn't save it");
			}
		});

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			trigger={trigger}
			busy={pending}
			dirty={form.formState.isDirty}
			icon={editing ? <Edit2 size={26} variant="Bulk" /> : words.icon}
			title={editing ? `Edit ${product.name}` : `New ${words.noun}`}
			description={editing ? "Changes apply to what you sell from now on: what was sold keeps its price." : words.intro}
			footer={
				<Button type="submit" form={formId} disabled={pending} className="h-11 rounded-xl">
					{pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
					{editing ? "Save changes" : "Add to price list"}
				</Button>
			}
		>
			<Form {...form}>
				<form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-2">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input placeholder={words.placeholder} autoComplete="off" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{kind === "membership" ? (
						<>
							<NumberField name="price" label="Price" suffix={CURRENCY} placeholder="700" />
							<div className="grid grid-cols-2 gap-4">
								<NumberField name="credits" label="Credits" suffix="visits" whole />
								<NumberField name="durationMonths" label="Lasts" suffix="months" whole />
							</div>
							{editing ? (
								<p className="text-sm text-muted-foreground">Cards already sold keep their credits and their end date.</p>
							) : null}
						</>
					) : (
						<>
							<fieldset className="grid gap-2">
								<legend className="mb-2 text-sm font-medium">Group size</legend>
								<div className="grid grid-cols-2 gap-4">
									<NumberField name="groupMin" label="From" suffix="pax" whole placeholder="1" />
									<NumberField name="groupMax" label="To" suffix="pax" whole placeholder="no limit" />
								</div>
								<p className="text-sm text-muted-foreground">
									Empty for any group. “From 10” with no end reads 10+ pax.
								</p>
							</fieldset>
							<NumberField name="price" label="Price per session" suffix={CURRENCY} placeholder="450" />

							{/* How it will read when she picks it on a quotation. */}
							<div className="grid gap-1 rounded-2xl bg-secondary/30 p-4">
								<span className="text-xs font-medium text-muted-foreground">On a quotation</span>
								<div className="flex items-baseline justify-between gap-3">
									<span className="truncate font-semibold">{preview}</span>
									<span className="shrink-0 text-sm">
										{Number.isFinite(previewPrice) ? <Money amount={previewPrice} /> : "—"}
										<span className="text-muted-foreground"> / session</span>
									</span>
								</div>
							</div>
						</>
					)}
				</form>
			</Form>
		</FormSheet>
	);
}
