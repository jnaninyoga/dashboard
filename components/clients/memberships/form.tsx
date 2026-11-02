"use client";

import { startTransition, useActionState, useEffect, useId } from "react";
import { useForm } from "react-hook-form";

import { FormSheet } from "@/components/form-sheet";
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
import { createMembershipProduct, updateMembershipProduct } from "@/lib/actions/clients/memberships";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { type Membership } from "@/lib/types";
import { normalizeDecimalInput } from "@/lib/utils/currency";
import { CURRENCY } from "@/lib/utils/currency";
import {
	type MembershipProductFormInput,
	type MembershipProductFormValues,
	membershipProductSchema} from "@/lib/validators";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card, Edit2, Refresh as Loader2 } from "iconsax-reactjs";

type MembershipSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Edit mode: the membership to change. */
	initialData?: Membership;
	trigger?: React.ReactNode;
};

const defaultsFor = (product?: Membership): MembershipProductFormValues => ({
	name: product?.name ?? "",
	basePrice: product?.basePrice ? parseFloat(product.basePrice) : 0,
	durationMonths: product?.durationMonths ?? 1,
	defaultCredits: product?.defaultCredits ?? 10,
});

export function MembershipSheet({ open, onOpenChange, initialData, trigger }: MembershipSheetProps) {
	const formId = useId();
    const isEditing = !!initialData;
    const action = isEditing && initialData
        ? updateMembershipProduct.bind(null, initialData.id)
        : createMembershipProduct;

    const [state, formAction, isPending] = useActionState(action, null);

	const form = useForm<MembershipProductFormInput, unknown, MembershipProductFormValues>({
		resolver: zodResolver(membershipProductSchema),
		defaultValues: defaultsFor(initialData),
	});

	// Each open starts from the saved values, not from a discarded edit.
	useEffect(() => {
		if (open) form.reset(defaultsFor(initialData));
	}, [open, initialData, form]);

    useEffect(() => {
        if (state?.success) {
            notify.success(isEditing ? "Membership updated" : "Membership created");
            onOpenChange(false);
        } else if (state?.error) {
            notifyActionError(state, "Something went wrong");
        }
    }, [state, isEditing, onOpenChange]);

	function onSubmit(values: MembershipProductFormValues) {
		startTransition(() => {
			formAction(values);
		});
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			trigger={trigger}
			busy={isPending}
			dirty={form.formState.isDirty}
			icon={isEditing ? <Edit2 size={26} variant="Bulk" /> : <Card size={28} variant="Bulk" />}
			title={isEditing ? "Edit Membership" : "New Membership"}
			description={
				isEditing
					? "Changes apply to cards sold from now on."
					: "A card type you can sell to clients."
			}
			footer={
				<Button type="submit" form={formId} disabled={isPending} className="h-11 rounded-xl">
					{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
					{isEditing ? "Save Changes" : "Create Membership"}
				</Button>
			}
		>
			<Form {...form}>
				<form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
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
									<FormLabel>Price ({CURRENCY})</FormLabel>
									<FormControl>
										<Input
											inputMode="decimal"
											{...field}
											value={field.value ?? ""}
											onChange={(e) => {
												const val = normalizeDecimalInput(e.target.value);
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
                                <FormDescription className="text-warning text-xs font-medium">
                                    Note: Changing credits will only affect future sales. Active client wallets are preserved.
                                </FormDescription>
                            ) : null}
								<FormMessage />
							</FormItem>
						)}
					/>
				</form>
			</Form>
		</FormSheet>
	);
}
