"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { type Category } from "@/lib/types";
import { type CategoryFormValues,categorySchema } from "@/lib/validators";

import { zodResolver } from "@hookform/resolvers/zod";
import { Refresh as Loader2 } from "iconsax-reactjs";
import { toast } from "sonner";

interface CategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category?: Category | null;
}

export function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
    const isEditing = !!category;
    
    const action = isEditing && category 
        ? updateClientCategory.bind(null, category.id) 
        : createClientCategory;

    const [state, formAction, isPending] = useActionState(action, null);

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: category?.name ?? "",
            discountType: category?.discountType ?? "percentage",
            discountValue: category?.discountValue ? parseFloat(category.discountValue) : 0,
        },
    });

    useEffect(() => {
        if (state?.success) {
            toast.success(isEditing ? "Category updated" : "Category created");
            onOpenChange(false);
            if (!isEditing) form.reset();
        } else if (state?.error) {
            toast.error(state.error);
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Category" : "New Category"}</DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                <SelectItem value="fixed">Fixed Amount (MAD)</SelectItem>
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
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isEditing ? "Save Changes" : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
