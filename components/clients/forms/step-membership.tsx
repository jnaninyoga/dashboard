
"use client";

import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientFormValues } from "@/lib/validators";
import { getMembershipProductsAction } from "@/actions/wallets";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StepMembershipProps {
	form: UseFormReturn<ClientFormValues>;
}

export function StepMembership({ form }: StepMembershipProps) {
	const [products, setProducts] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

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

	return (
		<div className="space-y-6">
			<div className="text-center mb-8">
				<h3 className="text-lg font-medium">Select a Starting Membership</h3>
				<p className="text-sm text-muted-foreground">
					Optional: Choose a product to assign immediately upon registration.
				</p>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			) : (
				<FormField
					control={form.control}
                    // @ts-ignore
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

									{products.map((product) => (
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
													<div className="font-semibold text-lg">{product.name}</div>
													<div className="text-sm text-muted-foreground">
														{product.defaultCredits} Credits
													</div>
												</div>
                                                <Badge variant="secondary" className="w-fit mt-auto">
                                                    {product.basePrice} MAD
                                                </Badge>
											</label>
										</div>
									))}
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
