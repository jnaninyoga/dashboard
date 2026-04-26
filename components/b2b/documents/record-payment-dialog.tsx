"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { recordDocumentPaymentAction } from "@/lib/actions/b2b/documents";
import { type DocumentWithRelations } from "@/lib/types/b2b";
import { recordPaymentSchema, type RecordPaymentFormValues } from "@/lib/validators/document";
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
			<DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden border-none zen-shadow-lg">
				<DialogHeader className="p-8 pb-6 bg-card border-b">
					<div className="flex items-center gap-4">
						<div className="size-12 rounded-2xl bg-green-500/10 text-green-600 flex items-center justify-center border border-green-500/20">
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
						<div className="p-8 space-y-6">
							<FormField
								control={form.control}
								name="amountPaid"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amount Received (MAD)</FormLabel>
										<FormControl>
											<div className="relative">
												<Input 
													{...field} 
													className="h-12 rounded-xl font-mono text-lg font-black pl-10" 
													placeholder="0.00"
												/>
												<div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
													$
												</div>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="bg-muted/30 rounded-2xl p-5 space-y-3">
								<div className="flex justify-between items-center text-sm">
									<span className="text-muted-foreground font-bold uppercase tracking-widest text-[9px]">Invoice Total</span>
									<span className="font-bold">{totalAmount.toLocaleString()} MAD</span>
								</div>
								<Separator className="opacity-50" />
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground font-bold uppercase tracking-widest text-[9px]">Remaining Balance</span>
									<span className={`font-bold ${balance > 0 ? "text-amber-600" : "text-green-600"}`}>
										{balance.toLocaleString()} MAD
									</span>
								</div>
							</div>

							{balance > 0 && (
								<div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-[11px] text-amber-700 font-medium">
									<div className="size-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
										<MoneySend size={12} variant="Bold" />
									</div>
									The remaining {balance.toLocaleString()} MAD will be tracked as a postponed balance.
								</div>
							)}
						</div>

						<DialogFooter className="p-6 bg-muted/20 border-t">
							<Button 
								type="submit" 
								disabled={isPending} 
								className={`${balance > 0 ? "bg-amber-600 hover:bg-amber-700" : "bg-green-600 hover:bg-green-700"} w-full rounded-xl font-black h-11 gap-2`}
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
