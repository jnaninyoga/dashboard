"use client";

import { useEffect, useId, useRef, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormSheet } from "@/components/form-sheet";
import { Money } from "@/components/money";
import { PAYMENT_METHOD } from "@/components/payment-methods";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sellMembershipAction } from "@/lib/actions/clients/wallets";
import { cardExpiry, priceAfterDiscount } from "@/lib/domain/clients/membership-sale";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { type Discount, type Product } from "@/lib/types";
import { CURRENCY, formatMoney, normalizeDecimalInput, parseAmountInput } from "@/lib/utils/currency";
import { formatDay, studioDateString } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";
import { PAYMENT_METHODS, sellMembershipSchema, type SellMembershipValues } from "@/lib/validators";

import { zodResolver } from "@hookform/resolvers/zod";
import { CardAdd, Refresh as Loader2 } from "iconsax-reactjs";

const NO_DISCOUNT = "none";
const longDay = (date: string) => formatDay(date, { day: "numeric", month: "long", year: "numeric" });
/** What a price field holds: "700", "612.50". */
const asInput = (amount: number) => (Number.isInteger(amount) ? String(amount) : amount.toFixed(2));

/** "−12,5 %" or "−50,00 MAD": what a discount takes off. */
export function discountTerms(discount: Pick<Discount, "discountType" | "discountValue">) {
	return discount.discountType === "percentage"
		? `−${Number(discount.discountValue).toLocaleString("fr-FR", { maximumFractionDigits: 2 })}\u00A0%`
		: `−${formatMoney(discount.discountValue)}`;
}

/**
 * Sells a membership card to a client, the way it happens at the desk: the
 * card from her price list, the client's discount (or another, or none),
 * the price that comes out of it (she can settle on another), the day, and
 * how she was paid. The receipt shows what the card gives and until when.
 */
export function SellMembershipSheet({
	clientId,
	memberships,
	discounts,
	clientDiscountId,
	open,
	onOpenChange,
	trigger,
}: {
	clientId: string;
	/** Her memberships on sale. */
	memberships: Product[];
	discounts: Discount[];
	/** The discount this client has: offered first. */
	clientDiscountId?: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	trigger?: React.ReactNode;
}) {
	const formId = useId();
	const [pending, startTransition] = useTransition();
	const today = studioDateString();

	const freshSale = (): SellMembershipValues => {
		const membership = memberships.length === 1 ? memberships[0] : undefined;
		const discount = discounts.find((d) => d.id === clientDiscountId) ?? null;
		return {
			membershipId: membership?.id ?? "",
			discountId: discount?.id ?? null,
			price: membership ? asInput(priceAfterDiscount(membership.price, discount).price) : "",
			soldOn: today,
			paymentMethod: "cash",
			paymentReference: "",
			physicalCardRef: "",
		};
	};

	const form = useForm<SellMembershipValues>({ resolver: zodResolver(sellMembershipSchema), defaultValues: freshSale() });

	useEffect(() => {
		if (open) form.reset(freshSale());
		// A fresh sale each time it opens; the lists only change between opens.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	const [membershipId, discountId, price, soldOn, method] = useWatch({
		control: form.control,
		name: ["membershipId", "discountId", "price", "soldOn", "paymentMethod"],
	});
	const membership = memberships.find((m) => m.id === membershipId);
	const discount = discounts.find((d) => d.id === discountId) ?? null;
	const computed = membership ? priceAfterDiscount(membership.price, discount) : null;

	// The price follows the card and the discount until she types her own.
	const typedPrice = useRef(false);
	useEffect(() => {
		if (open) typedPrice.current = false;
	}, [open]);
	useEffect(() => {
		if (!computed || typedPrice.current) return;
		form.setValue("price", asInput(computed.price), { shouldValidate: form.formState.isSubmitted });
	}, [computed?.price, form]); // eslint-disable-line react-hooks/exhaustive-deps

	const paid = parseAmountInput(price ?? "");
	const agreed = computed && Number.isFinite(paid) && Math.round(paid * 100) !== Math.round(computed.price * 100);
	const until = membership ? cardExpiry(soldOn || today, membership.durationMonths) : null;

	const onSubmit = (values: SellMembershipValues) =>
		startTransition(async () => {
			const result = await sellMembershipAction(clientId, values);
			if (result.success) {
				notify.success(`${membership?.name ?? "Card"} sold${until ? `, until ${longDay(until)}` : ""}`);
				onOpenChange(false);
			} else {
				notifyActionError(result, "Couldn't record the sale");
			}
		});

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			trigger={trigger}
			busy={pending}
			dirty={form.formState.isDirty}
			icon={<CardAdd size={28} variant="Bulk" />}
			title="Sell a membership"
			description="The card's credits are theirs right away, until its last day."
			footer={
				<Button type="submit" form={formId} disabled={pending || !memberships.length} className="h-11 rounded-xl">
					{pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
					{Number.isFinite(paid) && membership ? `Sell for ${formatMoney(paid)}` : "Sell"}
				</Button>
			}
		>
			<Form {...form}>
				<form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
					<FormField
						control={form.control}
						name="membershipId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Membership</FormLabel>
								{memberships.length ? (
									<div role="radiogroup" aria-label="Membership" className="grid gap-2">
										{memberships.map((m) => (
											<label
												key={m.id}
												className="has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:ring-ring hover:bg-secondary/30 flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition-colors has-[:focus-visible]:ring-2"
											>
												<input
													type="radio"
													name={field.name}
													value={m.id}
													checked={field.value === m.id}
													onChange={() => field.onChange(m.id)}
													className="sr-only"
												/>
												<span className="min-w-0 flex-1">
													<span className="block truncate font-semibold">{m.name}</span>
													<span className="text-muted-foreground text-sm">
														{m.credits} {m.credits === 1 ? "visit" : "visits"}
														{m.durationMonths ? ` · ${m.durationMonths} ${m.durationMonths === 1 ? "month" : "months"}` : " · no end"}
													</span>
												</span>
												<Money amount={m.price} className="font-semibold" />
											</label>
										))}
									</div>
								) : (
									<p className="text-muted-foreground rounded-2xl border border-dashed p-4 text-sm">
										No membership on sale. Add one to your price list first.
									</p>
								)}
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="discountId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Discount</FormLabel>
								<Select value={field.value ?? NO_DISCOUNT} onValueChange={(v) => field.onChange(v === NO_DISCOUNT ? null : v)}>
									<FormControl>
										<SelectTrigger className="h-11 w-full rounded-xl">
											<SelectValue />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value={NO_DISCOUNT}>No discount</SelectItem>
										{discounts.map((d) => (
											<SelectItem key={d.id} value={d.id}>
												{d.name} ({discountTerms(d)}){d.id === clientDiscountId ? " · theirs" : ""}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* The receipt: her price, the discount, what's paid, what it gives. */}
					{membership && computed ? (
						<section aria-label="This sale" className="bg-secondary/30 grid gap-2 rounded-2xl p-4 text-sm">
							<div className="flex items-baseline justify-between gap-3">
								<span>{membership.name}</span>
								<Money amount={computed.list} />
							</div>
							{discount && computed.off > 0 ? (
								<div className="text-muted-foreground flex items-baseline justify-between gap-3">
									<span>
										{discount.name} {discountTerms(discount)}
									</span>
									<Money amount={computed.off} sign="−" />
								</div>
							) : null}
							<div className="border-secondary-2/40 mt-1 flex items-baseline justify-between gap-3 border-t pt-2">
								<span className="font-semibold">{agreed ? "Agreed price" : "To pay"}</span>
								<span className="font-heading text-primary text-xl font-bold">
									<Money amount={Number.isFinite(paid) ? paid : computed.price} />
								</span>
							</div>
							<p className="text-muted-foreground">
								{membership.credits} {membership.credits === 1 ? "credit" : "credits"}
								{until ? `, to use by ${longDay(until)}.` : ", with no end date."}
								{agreed ? ` ${formatMoney(Math.abs(computed.price - paid))} ${paid < computed.price ? "under" : "over"} the price with the discount.` : ""}
							</p>
						</section>
					) : null}

					<div className="grid grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="price"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Price paid</FormLabel>
									<div className="relative">
										<FormControl>
											<Input
												inputMode="decimal"
												{...field}
												onChange={(event) => {
													typedPrice.current = true;
													field.onChange(normalizeDecimalInput(event.target.value));
												}}
												className="pr-14 tabular-nums"
											/>
										</FormControl>
										<span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold">
											{CURRENCY}
										</span>
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="soldOn"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Sold on</FormLabel>
									<FormControl>
										<Input type="date" max={today} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="paymentMethod"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Paid by</FormLabel>
								<div role="radiogroup" aria-label="Paid by" className="bg-secondary/40 grid grid-cols-4 gap-1 rounded-2xl p-1">
									{PAYMENT_METHODS.map((m) => (
										<label
											key={m}
											className="text-muted-foreground hover:text-foreground has-[:checked]:bg-card has-[:checked]:text-foreground has-[:focus-visible]:ring-ring flex min-h-10 cursor-pointer items-center justify-center rounded-xl px-2 text-sm font-semibold transition-colors has-[:checked]:shadow-sm has-[:focus-visible]:ring-2"
										>
											<input
												type="radio"
												name={field.name}
												value={m}
												checked={field.value === m}
												onChange={() => field.onChange(m)}
												className="sr-only"
											/>
											{PAYMENT_METHOD[m].label}
										</label>
									))}
								</div>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className={cn("grid gap-4", method === "cheque" || method === "transfer" ? "grid-cols-2" : "grid-cols-1")}>
						{method === "cheque" || method === "transfer" ? (
							<FormField
								control={form.control}
								name="paymentReference"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{method === "cheque" ? "Cheque no." : "Transfer ref."}</FormLabel>
										<FormControl>
											<Input autoComplete="off" {...field} value={field.value ?? ""} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						) : null}
						<FormField
							control={form.control}
							name="physicalCardRef"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Card number</FormLabel>
									<FormControl>
										<Input autoComplete="off" placeholder="On the paper card, if any" {...field} value={field.value ?? ""} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</form>
			</Form>
		</FormSheet>
	);
}
