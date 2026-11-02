"use client";

import { useEffect, useState } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";

import { Money } from "@/components/money";
import { PAYMENT_METHOD } from "@/components/payment-methods";
import { Badge } from "@/components/ui/badge";
import {
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getMembershipProductsAction } from "@/lib/actions/clients/wallets";
import { priceAfterDiscount } from "@/lib/domain/clients/membership-sale";
import { type Discount } from "@/lib/types";
import { formatMoney } from "@/lib/utils/currency";
import { ClientFormValues, PAYMENT_METHODS } from "@/lib/validators";
import { type Product } from "@/services/database/schema";

import { Refresh } from "iconsax-reactjs";

interface StepMembershipProps {
	form: UseFormReturn<ClientFormValues>;
	discounts: Discount[];
	mode?: "create" | "edit";
}

export function StepMembership({ form, discounts, mode }: StepMembershipProps) {
	const [products, setProducts] = useState<Product[]>([]);
	const [isLoading, setIsLoading] = useState(mode !== "edit");

	const discountId = useWatch({
		control: form.control,
		name: "discountId",
	});
	const initialProductId = useWatch({ control: form.control, name: "initialProductId" });

	useEffect(() => {
		if (mode === "edit") return;
		const fetchProducts = async () => {
			const result = await getMembershipProductsAction();
			if (result.success && result.products) {
				setProducts(result.products);
			}
			setIsLoading(false);
		};
		fetchProducts();
	}, [mode]);

	if (mode === "edit") {
		return (
			<div className="flex flex-col items-center justify-center space-y-2 py-16 text-center">
				<h3 className="text-lg font-semibold">Membership is managed from the client profile</h3>
				<p className="text-muted-foreground text-sm">
					You can assign or change memberships directly on the client&apos;s profile page.
				</p>
			</div>
		);
	}

	const selectedDiscount = discounts.find((c) => c.id === discountId);

	// The shared sale rule: the same price the sale will record.
	const calculatePrice = (basePrice: string) => {
		const { list, price, off } = priceAfterDiscount(basePrice, selectedDiscount ?? null);
		return { price: price.toFixed(2), originalPrice: list.toFixed(2), isDiscounted: off > 0 };
	};

	return (
		<div className="space-y-6">
			<div className="mb-8 text-center">
				<h3 className="text-lg font-medium">Select a Starting Membership</h3>
				<p className="text-muted-foreground text-sm">
					Optional: Choose a product to assign immediately upon registration.
				</p>
				{selectedDiscount ? (
					<Badge variant="outline" className="text-primary mt-2">
						Discount: {selectedDiscount.name}
						{parseFloat(selectedDiscount.discountValue) > 0 ? (
							` (${selectedDiscount.discountType === "percentage" ? `-${selectedDiscount.discountValue}%` : `−${formatMoney(selectedDiscount.discountValue)}`})`
						) : null}
					</Badge>
				) : null}
			</div>

			{isLoading ? (
				<div className="flex justify-center py-12">
					<Refresh className="text-primary h-8 w-8 animate-spin" variant="Outline" />
				</div>
			) : (
				<FormField
					control={form.control}
					name="initialProductId"
					render={({ field }) => (
						<FormItem className="space-y-3">
							<FormControl>
								<RadioGroup
									onValueChange={field.onChange}
									defaultValue={field.value as string}
									className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
								>
									{/* Option to skip */}
									<div className="col-span-full mb-2">
										<RadioGroupItem
											value=""
											id="no-product"
											className="peer sr-only"
										/>
										<label
											htmlFor="no-product"
											className="border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary flex cursor-pointer flex-col items-center justify-center rounded-md border-2 p-4"
										>
											<span className="font-semibold">No Membership for Now</span>
										</label>
									</div>

									{products.map((product) => {
										const { price, originalPrice, isDiscounted } = calculatePrice(
											product.price,
										);
										return (
											<div key={product.id}>
												<RadioGroupItem
													value={product.id}
													id={product.id}
													className="peer sr-only"
												/>
												<label
													htmlFor={product.id}
													className="border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary flex h-full cursor-pointer flex-col justify-between rounded-md border-2 p-4"
												>
													<div className="mb-2">
														<div className="text-lg font-semibold">
															{product.name}
														</div>
														<div className="text-muted-foreground text-sm">
															{product.credits} Credits
														</div>
													</div>
													<div className="mt-auto flex flex-col items-end">
														{isDiscounted ? (
															<span className="text-muted-foreground text-xs line-through">
																<Money amount={originalPrice ?? price} />
															</span>
														) : null}
														<Badge variant="secondary" className="w-fit">
															<Money amount={price} />
														</Badge>
													</div>
												</label>
											</div>
										);
									})}
								</RadioGroup>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			)}

			{/* Her first membership is a sale: how was it paid? */}
			{initialProductId ? (
				<FormField
					control={form.control}
					name="initialPaymentMethod"
					render={({ field }) => (
						<FormItem className="space-y-2">
							<p className="text-sm font-semibold">Paid by</p>
							<FormControl>
								<div role="radiogroup" aria-label="Paid by" className="bg-secondary/40 grid grid-cols-4 gap-1 rounded-2xl p-1">
									{PAYMENT_METHODS.map((method) => (
										<label
											key={method}
											className="text-muted-foreground hover:text-foreground has-[:checked]:bg-card has-[:checked]:text-foreground has-[:focus-visible]:ring-ring flex min-h-10 cursor-pointer items-center justify-center rounded-xl px-2 text-sm font-semibold transition-colors has-[:checked]:shadow-sm has-[:focus-visible]:ring-2"
										>
											<input
												type="radio"
												name={field.name}
												value={method}
												checked={(field.value ?? "cash") === method}
												onChange={() => field.onChange(method)}
												className="sr-only"
											/>
											{PAYMENT_METHOD[method].label}
										</label>
									))}
								</div>
							</FormControl>
						</FormItem>
					)}
				/>
			) : null}
		</div>
	);
}
