"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";

import { createMembershipProduct, updateMembershipProduct } from "@/lib/actions/clients/memberships";
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
import { type MembershipProduct } from "@/lib/types";
import { 
	type MembershipProductFormValues, 
	membershipProductSchema} from "@/lib/validators";

import { zodResolver } from "@hookform/resolvers/zod";
import { Refresh as Loader2 } from "iconsax-reactjs";
import { toast } from "sonner";

type MembershipFormProps = {
	initialData?: MembershipProduct;
	onSuccess: () => void;
};

export function MembershipForm({ initialData, onSuccess }: MembershipFormProps) {
    const isEditing = !!initialData;
    const action = isEditing && initialData 
        ? updateMembershipProduct.bind(null, initialData.id) 
        : createMembershipProduct;

    const [state, formAction, isPending] = useActionState(action, null);

	const form = useForm<MembershipProductFormValues>({
		resolver: zodResolver(membershipProductSchema),
		defaultValues: {
			name: initialData?.name ?? "",
			basePrice: initialData?.basePrice ? parseFloat(initialData.basePrice) : 0,
			durationMonths: initialData?.durationMonths ?? 1,
			defaultCredits: initialData?.defaultCredits ?? 10,
		},
	});

    useEffect(() => {
        if (state?.success) {
            toast.success(isEditing ? "Product updated" : "Product created");
            onSuccess();
        } else if (state?.error) {
            toast.error(state.error);
        }
    }, [state, isEditing, onSuccess]);

	async function onSubmit(values: MembershipProductFormValues) {
		startTransition(() => {
			formAction(values);
		});
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input placeholder="Gold Membership" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="basePrice"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Price (MAD)</FormLabel>
								<FormControl>
									<Input 
										inputMode="decimal"
										{...field} 
										value={field.value ?? ""} 
										onChange={(e) => {
											const val = e.target.value.replace(/[^0-9.]/g, "");
											const parts = val.split(".");
											const sanitized = parts[0] + (parts.length > 1 ? "." + parts.slice(1).join("") : "");
											field.onChange(sanitized);
										}}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="durationMonths"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Duration (Months)</FormLabel>
								<FormControl>
									<Input 
                                        inputMode="numeric"
                                        {...field} 
                                        value={field.value ?? ""}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, "");
                                            const months = parseInt(val) || 0;
                                            field.onChange(months);
                                            if (months > 0) {
                                                form.setValue("defaultCredits", months * 12);
                                            }
                                        }}
                                    />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="defaultCredits"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Credits (Classes)</FormLabel>
							<FormControl>
								<Input 
									inputMode="numeric"
									{...field} 
									value={field.value ?? ""} 
									onChange={(e) => {
										const val = e.target.value.replace(/[^0-9]/g, "");
										field.onChange(parseInt(val) || 0);
									}}
								/>
							</FormControl>
                            {initialData ? (
                                <FormDescription className="text-xs font-medium text-amber-600">
                                    Note: Changing credits will only affect future sales. Active client wallets are preserved.
                                </FormDescription>
                            ) : null}
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end pt-4">
					<Button type="submit" disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
						{initialData ? "Update Product" : "Create Product"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
