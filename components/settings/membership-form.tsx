"use client";

import { useForm } from "react-hook-form";

import { createMembershipProduct, updateMembershipProduct } from "@/actions/memberships";
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

import { zodResolver } from "@hookform/resolvers/zod";
import { Refresh as Loader2 } from "iconsax-reactjs";
import * as z from "zod";

const formSchema = z.object({
	name: z.string().min(1, "Name is required"),
	basePrice: z.coerce.number().min(0, "Price must be positive"),
	durationMonths: z.coerce.number().int().min(1, "Duration must be at least 1 month"),
	defaultCredits: z.coerce.number().int().min(1, "Credits must be at least 1"),
});

type MembershipFormProps = {
	initialData?: {
		id: string;
		name: string;
		basePrice: string; // Decimal comes as string
		defaultCredits: number;
		durationMonths: number | null;
	};
	onSuccess: () => void;
};

export function MembershipForm({ initialData, onSuccess }: MembershipFormProps) {
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: initialData?.name || "",
			basePrice: initialData ? parseFloat(initialData.basePrice) : 0,
			durationMonths: initialData?.durationMonths || 1,
			defaultCredits: initialData?.defaultCredits || 12,
		},
	});

    // I will use `onChange` in the render to trigger the calc.

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			if (initialData) {
				await updateMembershipProduct(initialData.id, values);
			} else {
				await createMembershipProduct(values);
			}
			onSuccess();
		} catch (error) {
			console.error("Failed to save membership product", error);
            // In a real app, I'd show a toast here
		}
	}

    const { isSubmitting } = form.formState;

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
									<Input type="number" step="0.01" {...field} value={field.value as number} />
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
                                        type="number" 
                                        {...field} 
                                        value={field.value as number}
                                        onChange={(e) => {
                                            field.onChange(e);
                                            // Auto-calc logic: Months * 12
                                            const months = parseInt(e.target.value);
                                            if (!isNaN(months)) {
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
								<Input type="number" {...field} value={field.value as number} />
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
					<Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
						{initialData ? "Update Product" : "Create Product"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
