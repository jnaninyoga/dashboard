"use client";

import { useActionState, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { createClientCategory, updateClientCategory } from "@/actions/settings";
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

import { zodResolver } from "@hookform/resolvers/zod";
import { Refresh as Loader2 } from "iconsax-reactjs";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().min(0, "Value must be positive"),
});

type CategoryValues = z.infer<typeof formSchema>;

interface Category {
    id: string;
    name: string;
    discountType: "percentage" | "fixed";
    discountValue: string;
    isArchived: boolean;
}

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

    const form = useForm<CategoryValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: category?.name || "",
            discountType: category?.discountType || "percentage",
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

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        // We pass the values to the formAction
        // Since useActionState action expects (prevState, data), 
        // we can call it in a transition or if it's already bound, just trigger it.
        // Wait, formAction from useActionState expects FormData for native forms, 
        // but can be any data if we call it manually.
        // Actually, the recommended way with RHF is to use startTransition.
        // However, we can also just use the action as a normal function.
        // Let's use startTransition for the modernization feel.
        // But for these simple objects, we can just pass the data if the action supports it.
        // My actions are: createClientCategory(prevState, data: { name ... })
        const { startTransition } = await import("react");
        startTransition(() => {
            formAction(values);
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
                                                type="number" 
                                                step="0.01" 
                                                {...field} 
                                                value={field.value ?? ""}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
