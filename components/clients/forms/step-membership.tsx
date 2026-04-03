
"use client";

import { useEffect, useState } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import {
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ClientFormValues } from "@/lib/validators";
import { getMembershipProductsAction } from "@/actions/wallets";
import { Refresh } from "iconsax-reactjs";
import { Badge } from "@/components/ui/badge";
import { type Category } from "@/lib/types";

interface StepMembershipProps {
	form: UseFormReturn<ClientFormValues>;
	categories: Category[];
	mode?: "create" | "edit";
}

export function StepMembership({ form, categories, mode }: StepMembershipProps) {
	if (mode === "edit") {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
				<h3 className="text-lg font-semibold">Membership is managed from the client profile</h3>
				<p className="text-sm text-muted-foreground">
					You can assign or change memberships directly on the client&apos;s profile page.
				</p>
			</div>
		);
	}

	const [products, setProducts] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const categoryId = useWatch({
		control: form.control,
		name: "categoryId",
	});

	const selectedCategory = categories.find((c) => c.id === categoryId);

	useEffect(() => {
		const fetchProducts = async () => {
			const result = await getMembershipProductsAction();
			if (result.success && result.products) {
				setProducts(result.products);
			}
			setIsLoading(false);
		};
		fetchProducts();
	}, []);

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
			<div className="text-center mb-8">
				<h3 className="text-lg font-medium">Select a Starting Membership</h3>
				<p className="text-sm text-muted-foreground">
					Optional: Choose a product to assign immediately upon registration.
				</p>
				{selectedCategory && (
					<Badge variant="outline" className="mt-2 text-primary">
						Applied Category: {selectedCategory.name}
						{parseFloat(selectedCategory.discountValue) > 0 &&
							` (${selectedCategory.discountType === "percentage" ? `-${selectedCategory.discountValue}%` : `-${selectedCategory.discountValue} MAD`})`}
					</Badge>
				)}
			</div>

			{isLoading ? (
				<div className="flex justify-center py-12">
					<Refresh className="h-8 w-8 animate-spin text-primary" variant="Outline" />
				</div>
			) : (
				<FormField
					control={form.control}
					// @ts-expect-error - dynamic field assignment
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
											className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer"
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
													className="flex flex-col justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer h-full"
												>
													<div className="mb-2">
														<div className="font-semibold text-lg">
															{product.name}
														</div>
														<div className="text-sm text-muted-foreground">
															{product.defaultCredits} Credits
														</div>
													</div>
													<div className="mt-auto flex flex-col items-end">
														{isDiscounted && (
															<span className="text-xs text-muted-foreground line-through">
																{originalPrice} MAD
															</span>
														)}
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
