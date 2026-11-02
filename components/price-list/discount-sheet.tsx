"use client";

import { useEffect, useId, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormSheet } from "@/components/form-sheet";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { saveDiscountAction } from "@/lib/actions/settings";
import { priceAfterDiscount } from "@/lib/domain/clients/membership-sale";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { type Discount, type Product } from "@/lib/types";
import { CURRENCY, formatAmount, normalizeDecimalInput, parseAmountInput } from "@/lib/utils/currency";
import { type DiscountFormInput, type DiscountFormValues, discountSchema } from "@/lib/validators";

import { zodResolver } from "@hookform/resolvers/zod";
import { DiscountShape, Edit2, Refresh as Loader2 } from "iconsax-reactjs";

const defaultsFor = (discount?: Discount): DiscountFormInput => ({
	name: discount?.name ?? "",
	discountType: discount?.discountType ?? "percentage",
	discountValue: discount ? String(Number(discount.discountValue)).replace(".", ",") : "",
});

/**
 * Adds a discount or changes one, and shows what it does to each card on
 * her price list as she types.
 */
export function DiscountSheet({
	discount,
	memberships,
	open,
	onOpenChange,
	trigger,
}: {
	/** Edit mode: the discount to change. */
	discount?: Discount;
	/** Her memberships on sale, to show the discount on them. */
	memberships: Product[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	trigger?: React.ReactNode;
}) {
	const formId = useId();
	const [pending, startTransition] = useTransition();
	const editing = !!discount;

	const form = useForm<DiscountFormInput, unknown, DiscountFormValues>({
		resolver: zodResolver(discountSchema),
		defaultValues: defaultsFor(discount),
	});

	useEffect(() => {
		if (open) form.reset(defaultsFor(discount));
	}, [open, discount, form]);

	const [type, rawValue] = useWatch({ control: form.control, name: ["discountType", "discountValue"] });
	const value = parseAmountInput(String(rawValue ?? ""));
	const terms = Number.isFinite(value) && value > 0 ? { name: "", discountType: type, discountValue: value } : null;

	const onSubmit = (values: DiscountFormValues) =>
		startTransition(async () => {
			const result = await saveDiscountAction(discount?.id ?? null, values);
			if (result.success) {
				notify.success(editing ? "Discount saved" : "Discount added");
				onOpenChange(false);
			} else {
				notifyActionError(result, "Couldn't save the discount");
			}
		});

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			trigger={trigger}
			busy={pending}
			dirty={form.formState.isDirty}
			icon={editing ? <Edit2 size={26} variant="Bulk" /> : <DiscountShape size={28} variant="Bulk" />}
			title={editing ? `Edit ${discount.name}` : "New discount"}
			description={
				editing
					? "Clients who have it get the change on their next card; cards sold keep their price."
					: "Give it to a client: it comes off every membership they buy."
			}
			footer={
				<Button type="submit" form={formId} disabled={pending} className="h-11 rounded-xl">
					{pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
					{editing ? "Save changes" : "Add discount"}
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
									<Input placeholder="Senior" autoComplete="off" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="discountType"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Takes off</FormLabel>
								<div role="radiogroup" aria-label="Takes off" className="bg-secondary/40 grid grid-cols-2 gap-1 rounded-2xl p-1">
									{(
										[
											["percentage", "A share of the price"],
											["fixed", `An amount in ${CURRENCY}`],
										] as const
									).map(([option, label]) => (
										<label
											key={option}
											className="text-muted-foreground hover:text-foreground has-[:checked]:bg-card has-[:checked]:text-foreground has-[:focus-visible]:ring-ring flex min-h-10 cursor-pointer items-center justify-center rounded-xl px-2 text-sm font-semibold transition-colors has-[:checked]:shadow-sm has-[:focus-visible]:ring-2"
										>
											<input
												type="radio"
												name={field.name}
												value={option}
												checked={field.value === option}
												onChange={() => field.onChange(option)}
												className="sr-only"
											/>
											{label}
										</label>
									))}
								</div>
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="discountValue"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{type === "percentage" ? "Percentage" : "Amount"}</FormLabel>
								<div className="relative">
									<FormControl>
										<Input
											inputMode="decimal"
											placeholder={type === "percentage" ? "12,5" : "50"}
											{...field}
											value={field.value ?? ""}
											onChange={(event) => field.onChange(normalizeDecimalInput(event.target.value))}
											className="pr-14 tabular-nums"
										/>
									</FormControl>
									<span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold">
										{type === "percentage" ? "%" : CURRENCY}
									</span>
								</div>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Her cards, with the discount taken off. */}
					{memberships.length ? (
						<section aria-label="On your memberships" className="bg-secondary/30 grid gap-2 rounded-2xl p-4 text-sm">
							<span className="text-muted-foreground text-xs font-medium">On your memberships</span>
							{memberships.map((membership) => {
								const { list, price } = priceAfterDiscount(membership.price, terms);
								return (
									<div key={membership.id} className="flex items-baseline justify-between gap-3">
										<span className="truncate">{membership.name}</span>
										<span className="flex shrink-0 items-baseline gap-2">
											{price < list ? <s className="text-muted-foreground">{formatAmount(list)}</s> : null}
											<Money amount={price} className="font-semibold" />
										</span>
									</div>
								);
							})}
						</section>
					) : null}
				</form>
			</Form>
		</FormSheet>
	);
}
