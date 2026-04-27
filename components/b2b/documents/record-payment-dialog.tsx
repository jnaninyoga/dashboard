"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { Separator } from "@/components/ui/separator";
import { recordDocumentPaymentAction } from "@/lib/actions/b2b/documents";
import { type DocumentWithRelations } from "@/lib/types/b2b";
import { type RecordPaymentFormValues,recordPaymentSchema } from "@/lib/validators/document";

import { zodResolver } from "@hookform/resolvers/zod";
import { MoneySend, TickCircle, Wallet3 } from "iconsax-reactjs";
import { toast } from "sonner";

export function RecordPaymentDialog({ 
    doc, 
    open, 
    onOpenChange 
}: { 
    doc: DocumentWithRelations, 
    open: boolean, 
    onOpenChange: (open: boolean) => void 
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const form = useForm<RecordPaymentFormValues>({
		resolver: zodResolver(recordPaymentSchema),
		defaultValues: {
			amountPaid: doc.totalAmount,
		},
	});

	const onSubmit = (values: RecordPaymentFormValues) => {
		startTransition(async () => {
			const res = await recordDocumentPaymentAction(doc.id, values.amountPaid, doc.partnerId);

			if (res.success) {
				const isPartial = Number(values.amountPaid) < Number(doc.totalAmount);
				toast.success(isPartial ? "Partial payment recorded" : "Payment recorded successfully");
				onOpenChange(false);
				router.refresh();
			} else {
				toast.error(res.error || "Failed to record payment");
			}
		});
	};

	const watchedAmount = form.watch("amountPaid");
	const totalAmount = Number(doc.totalAmount);
	const paidAmount = Number(watchedAmount || 0);
	const balance = Math.max(0, totalAmount - paidAmount);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="zen-shadow-lg overflow-hidden rounded-3xl border-none p-0 sm:max-w-[400px]">
				<DialogHeader className="bg-card border-b p-8 pb-6">
					<div className="flex items-center gap-4">
						<div className="flex size-12 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-green-600">
							<Wallet3 size={24} variant="Bulk" />
						</div>
						<div>
							<DialogTitle className="text-xl font-bold tracking-tight">Record Payment</DialogTitle>
							<DialogDescription>
								Record payment for {doc.documentNumber}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="bg-card">
						<div className="space-y-6 p-8">
							<FormField
								control={form.control}
								name="amountPaid"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">Amount Received (MAD)</FormLabel>
										<FormControl>
											<div className="relative">
												<Input 
													{...field} 
													className="h-12 rounded-xl pl-10 font-mono text-lg font-black" 
													placeholder="0.00"
												/>
												<div className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 font-bold">
													$
												</div>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="bg-muted/30 space-y-3 rounded-2xl p-5">
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground text-[9px] font-bold tracking-widest uppercase">Invoice Total</span>
									<span className="font-bold">{totalAmount.toLocaleString()} MAD</span>
								</div>
								<Separator className="opacity-50" />
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground text-[9px] font-bold tracking-widest uppercase">Remaining Balance</span>
									<span className={`font-bold ${balance > 0 ? "text-amber-600" : "text-green-600"}`}>
										{balance.toLocaleString()} MAD
									</span>
								</div>
							</div>

							{balance > 0 && (
								<div className="flex items-center gap-2 rounded-xl border border-amber-500/10 bg-amber-500/5 p-3 text-[11px] font-medium text-amber-700">
									<div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
										<MoneySend size={12} variant="Bold" />
									</div>
									The remaining {balance.toLocaleString()} MAD will be tracked as a postponed balance.
								</div>
							)}
						</div>

						<DialogFooter className="bg-muted/20 border-t p-6">
							<Button 
								type="submit" 
								disabled={isPending} 
								className={`${balance > 0 ? "bg-amber-600 hover:bg-amber-700" : "bg-green-600 hover:bg-green-700"} h-11 w-full gap-2 rounded-xl font-black`}
							>
								{isPending ? "Recording..." : (
									<>
										<TickCircle size={18} variant="Bold" />
										Confirm {balance > 0 ? "Partial Payment" : "Full Payment"}
									</>
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
