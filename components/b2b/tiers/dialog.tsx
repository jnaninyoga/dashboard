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
import { createB2BTierAction, updateB2BTierAction } from "@/lib/actions/settings";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { type B2BTier } from "@/lib/types";
import { normalizeDecimalInput } from "@/lib/utils/currency";
import { CURRENCY } from "@/lib/utils/currency";
import { type B2BTierFormValues,b2bTierSchema } from "@/lib/validators";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit2, Refresh as Loader2, Tag2 } from "iconsax-reactjs";

interface B2BTierDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tier?: B2BTier | null;
}

export function B2BTierDialog({ open, onOpenChange, tier }: B2BTierDialogProps) {
    const formId = useId();
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
            notify.success(isEditing ? "Tier updated" : "Tier created");
            onOpenChange(false);
            if (!isEditing) form.reset();
        } else if (state?.error) {
            notifyActionError(state, "Something went wrong");
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

    const onSubmit = (values: B2BTierFormValues) => {
        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("price", values.price.toString());
        startTransition(() => formAction(formData));
    };

    return (
        <FormSheet
            open={open}
            onOpenChange={onOpenChange}
            busy={isPending}
            dirty={form.formState.isDirty}
            icon={isEditing ? <Edit2 size={26} variant="Bulk" /> : <Tag2 size={28} variant="Bulk" />}
            title={isEditing ? "Edit B2B Tier" : "New B2B Tier"}
            description="A price you can pick when booking a session for a partner."
            footer={
                <Button type="submit" form={formId} disabled={isPending} className="h-11 rounded-xl">
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isEditing ? "Save Changes" : "Create"}
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
                                <FormLabel>Price ({CURRENCY})</FormLabel>
                                <FormControl>
                                    <Input
                                        inputMode="decimal"
                                        {...field}
                                        name="price"
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
                </form>
            </Form>
        </FormSheet>
    );
}
