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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { saveProductAction } from "@/lib/actions/price-list";
import { googleTranslateUrl } from "@/lib/domain/events/rules";
import { productLabel } from "@/lib/domain/price-list/product";
import { linesOf, MAX_CARD_LINES } from "@/lib/domain/website/cards";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { notifyWebsite } from "@/lib/feedback/website";
import { type Product, type ProductKind } from "@/lib/types";
import { CURRENCY, parseAmountInput } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/ui";
import { type ProductFormInput, type ProductFormValues, productSchema } from "@/lib/validators";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card, Edit2, Global, Refresh as Loader2, Tag2, Translate, Warning2 } from "iconsax-reactjs";

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
		? {
				kind,
				name: product?.name ?? "",
				price,
				credits: blank(product?.credits ?? 10),
				durationMonths: blank(product?.durationMonths ?? 1),
				onSite: product?.onSite ?? false,
				siteKey: product?.siteKey ?? "",
				sitePosition: blank(product?.sitePosition ?? 0),
				popular: product?.popular ?? false,
				// What the card says on the site now: her lines, or the ones its key always had.
				sitePointsFr: product ? linesOf(product).fr.join("\n") : "",
				sitePointsEn: product ? (linesOf(product).en ?? []).join("\n") : "",
			}
		: { kind, name: product?.name ?? "", price, groupMin: blank(product?.groupMin), groupMax: blank(product?.groupMax) };
}

/** A card's lines: a text box, one line per row. */
function LinesField({ name, label, placeholder, description }: { name: "sitePointsFr" | "sitePointsEn"; label: string; placeholder: string; description: string }) {
	return (
		<FormField
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel>{label}</FormLabel>
					<FormControl>
						<Textarea rows={3} placeholder={placeholder} {...field} value={String(field.value ?? "")} className="min-h-24 resize-y" />
					</FormControl>
					<FormDescription>{description}</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
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

/** A yes/no on the card: a switch with its label and a line of help. */
function SwitchField({ name, label, description }: { name: FieldPath<ProductFormInput>; label: string; description?: string }) {
	return (
		<FormField
			name={name}
			render={({ field }) => (
				<FormItem className="flex items-center justify-between gap-4">
					<div className="grid gap-1">
						<FormLabel>{label}</FormLabel>
						{description ? <FormDescription>{description}</FormDescription> : null}
					</div>
					<FormControl>
						<Switch checked={field.value === true} onCheckedChange={field.onChange} />
					</FormControl>
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
				notifyWebsite(result.website);
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

							{/* How the card shows on jnaninyoga.com. */}
							<fieldset className="grid gap-4 rounded-2xl border border-secondary/30 p-4">
								<legend className="flex items-center gap-2 px-1 text-sm font-medium">
									<Global size={18} variant="Bulk" className="text-primary" />
									On the website
								</legend>
								<SwitchField name="onSite" label="Show on jnaninyoga.com" description="With its price, in the cards on the site." />
								{watched.kind === "membership" && watched.onSite ? (
									<>
										<FormField
											name="siteKey"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Key</FormLabel>
													<FormControl>
														<Input
															placeholder="start-to-align"
															autoCapitalize="none"
															autoComplete="off"
															spellCheck={false}
															{...field}
															value={String(field.value ?? "")}
														/>
													</FormControl>
													<FormDescription>The card’s name in the site’s links and texts. Keep it once it’s live.</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
										<NumberField name="sitePosition" label="Place in the row" whole placeholder="1" description="1 shows first." />
										<SwitchField name="popular" label="Popular badge" description="Shown on one card at a time looks best." />
										<LinesField name="sitePointsFr" label="Lines on the card" placeholder={"Suivi de progression\nFlexibilité de planning"} description={`In French, one per row, up to ${MAX_CARD_LINES}. They show under the lotus, above the price.`} />
										<LinesField name="sitePointsEn" label="In English" placeholder={"Progress tracking\nFlexible schedule"} description="Optional. One per row, in the same order." />
										{String(watched.sitePointsFr ?? "").trim() && !String(watched.sitePointsEn ?? "").trim() ? (
											<div className="grid gap-2 rounded-2xl bg-warning/10 p-4 text-sm text-foreground" role="status">
												<p className="flex gap-2">
													<Warning2 size={18} variant="Bold" className="mt-0.5 shrink-0 text-warning" />
													<span>The English is empty: English visitors will see the French lines.</span>
												</p>
												<a
													href={googleTranslateUrl(String(watched.sitePointsFr))}
													target="_blank"
													rel="noopener noreferrer"
													className="ml-6 inline-flex min-h-10 w-fit items-center gap-1.5 font-semibold text-primary hover:underline"
												>
													<Translate size={16} />
													Translate with Google
												</a>
											</div>
										) : null}
									</>
								) : null}
							</fieldset>
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
