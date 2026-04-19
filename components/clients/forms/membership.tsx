"use client";

import { useEffect, useState } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";

import { getMembershipProductsAction } from "@/actions/clients/wallets";
import { Badge } from "@/components/ui/badge";
import {
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { type MembershipProduct } from "@/drizzle/schema";
import { type Category } from "@/lib/types";
import { ClientFormValues } from "@/lib/validators";

import { Refresh } from "iconsax-reactjs";

interface StepMembershipProps {
	form: UseFormReturn<ClientFormValues>;
	categories: Category[];
	mode?: "create" | "edit";
}

export function StepMembership({ form, categories, mode }: StepMembershipProps) {
	const [products, setProducts] = useState<MembershipProduct[]>([]);
	const [isLoading, setIsLoading] = useState(mode !== "edit");

	const categoryId = useWatch({
		control: form.control,
		name: "categoryId",
	});

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

	const selectedCategory = categories.find((c) => c.id === categoryId);

	const calculatePrice = (basePrice: string) => {
		const price = parseFloat(basePrice);
		if (!selectedCategory || isNaN(price)) return { price, isDiscounted: false };

		let finalPrice = price;
		const discountValue = parseFloat(selectedCategory.discountValue);

		if (selectedCategory.discountType === "percentage") {
			finalPrice = price * (1 - discountValue / 100);
		} else {
			finalPrice = Math.max(0, price - discountValue);
		}

		return {
			price: finalPrice.toFixed(2),
			originalPrice: price.toFixed(2),
			isDiscounted: finalPrice !== price,
		};
	};

	return (
		<div className="space-y-6">
			<div className="mb-8 text-center">
				<h3 className="text-lg font-medium">Select a Starting Membership</h3>
				<p className="text-muted-foreground text-sm">
					Optional: Choose a product to assign immediately upon registration.
				</p>
				{selectedCategory ? (
					<Badge variant="outline" className="text-primary mt-2">
						Applied Category: {selectedCategory.name}
						{parseFloat(selectedCategory.discountValue) > 0 ? (
							` (${selectedCategory.discountType === "percentage" ? `-${selectedCategory.discountValue}%` : `-${selectedCategory.discountValue} MAD`})`
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
											product.basePrice,
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
															{product.defaultCredits} Credits
														</div>
													</div>
													<div className="mt-auto flex flex-col items-end">
														{isDiscounted ? (
															<span className="text-muted-foreground text-xs line-through">
																{originalPrice} MAD
															</span>
														) : null}
														<Badge variant="secondary" className="w-fit">
															{price} MAD
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
		</div>
	);
}
