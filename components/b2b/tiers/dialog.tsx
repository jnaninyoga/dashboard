"use client";

import { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";

import { createB2BTierAction, updateB2BTierAction } from "@/lib/actions/settings";
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
import { type B2BTier } from "@/lib/types";
import { type B2BTierFormValues,b2bTierSchema } from "@/lib/validators";

import { zodResolver } from "@hookform/resolvers/zod";
import { Refresh as Loader2 } from "iconsax-reactjs";
import { toast } from "sonner";

interface B2BTierDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tier?: B2BTier | null;
}

export function B2BTierDialog({ open, onOpenChange, tier }: B2BTierDialogProps) {
    const isEditing = !!tier;
    
    const action = tier ? updateB2BTierAction.bind(null, tier.id) : createB2BTierAction;

    const [state, formAction, isPending] = useActionState(action, null);

    const form = useForm<B2BTierFormValues>({
        resolver: zodResolver(b2bTierSchema),
        defaultValues: {
            name: tier?.name ?? "",
            price: tier?.price?.toString() ?? "0",
        },
    });

    useEffect(() => {
        if (state?.success) {
            toast.success(isEditing ? "Tier updated" : "Tier created");
            onOpenChange(false);
            if (!isEditing) form.reset();
        } else if (state?.error) {
            toast.error(state.error);
        }
    }, [state, isEditing, onOpenChange, form]);

    useEffect(() => {
        if (open) {
            form.reset({
                name: tier?.name || "",
                price: tier?.price?.toString() || "0",
            });
        }
    }, [open, tier, form]);

    const onSubmit = async (values: B2BTierFormValues) => {
        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("price", values.price.toString());
        formAction(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit B2B Tier" : "New B2B Tier"}</DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} name="name" placeholder="e.g. Famille (3-5 pax)" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price (MAD)</FormLabel>
                                    <FormControl>
                                        <Input 
                                            inputMode="decimal"
                                            {...field} 
                                            name="price"
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
