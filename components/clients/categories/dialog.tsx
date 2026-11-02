"use client";

import { startTransition, useActionState, useEffect, useId } from "react";
import { useForm } from "react-hook-form";

import { FormSheet } from "@/components/form-sheet";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClientCategory, updateClientCategory } from "@/lib/actions/settings";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { type Discount } from "@/lib/types";
import { normalizeDecimalInput } from "@/lib/utils/currency";
import { CURRENCY } from "@/lib/utils/currency";
import {
    type CategoryFormInput,
    type CategoryFormValues,
    categorySchema,
} from "@/lib/validators";

import { zodResolver } from "@hookform/resolvers/zod";
import { Category2, Edit2, Refresh as Loader2 } from "iconsax-reactjs";

interface CategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category?: Discount | null;
}

export function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
    const formId = useId();
    const isEditing = !!category;
    
    const action = isEditing && category 
        ? updateClientCategory.bind(null, category.id) 
        : createClientCategory;

    const [state, formAction, isPending] = useActionState(action, null);

    const form = useForm<CategoryFormInput, unknown, CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: category?.name ?? "",
            discountType: category?.discountType ?? "percentage",
            discountValue: category?.discountValue ? parseFloat(category.discountValue) : 0,
        },
    });

    useEffect(() => {
        if (state?.success) {
            notify.success(isEditing ? "Category updated" : "Category created");
            onOpenChange(false);
            if (!isEditing) form.reset();
        } else if (state?.error) {
            notifyActionError(state, "Something went wrong");
        }
    }, [state, isEditing, onOpenChange, form]);

    useEffect(() => {
        if (open) {
            form.reset({
                name: category?.name || "",
                discountType: category?.discountType || "percentage",
                discountValue: category?.discountValue ? parseFloat(category.discountValue) : 0,
            });
        }
    }, [open, category, form]);
    const handleSubmit = async (values: CategoryFormValues) => {
        const data = {
            ...values,
            discountType: values.discountType ?? "percentage",
        };
        startTransition(() => {
            formAction(data);
        });
    };

    return (
        <FormSheet
            open={open}
            onOpenChange={onOpenChange}
            busy={isPending}
            dirty={form.formState.isDirty}
            icon={isEditing ? <Edit2 size={26} variant="Bulk" /> : <Category2 size={28} variant="Bulk" />}
            title={isEditing ? "Edit Category" : "New Category"}
            description="Clients in this category get its discount on new cards."
            footer={
                <Button type="submit" form={formId} disabled={isPending} className="h-11 rounded-xl">
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isEditing ? "Save Changes" : "Create"}
                </Button>
            }
        >
                <Form {...form}>
                    <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="e.g. Senior" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="discountType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Discount Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                <SelectItem value="fixed">Fixed amount ({CURRENCY})</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="discountValue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Value</FormLabel>
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
                        </div>
                    </form>
                </Form>
        </FormSheet>
    );
}
