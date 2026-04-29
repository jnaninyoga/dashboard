"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { BoxAdd, InfoCircle } from "iconsax-reactjs";

interface BackorderDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (createBackorder: boolean) => void;
}

export function BackorderDialog({
	open,
	onOpenChange,
	onConfirm,
}: BackorderDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="zen-shadow-2xl bg-card overflow-hidden rounded-4xl border-none p-0 sm:max-w-[420px]">
				<AlertDialogHeader className="bg-card border-b p-8 pb-6">
					<div className="flex items-center gap-4 text-left">
						<div className="bg-primary/10 text-primary border-primary/20 zen-teal-glow flex size-14 items-center justify-center rounded-2xl border">
							<BoxAdd size={28} variant="Bulk" />
						</div>
						<div>
							<AlertDialogTitle className="text-xl font-black tracking-tight">
								Create Backorder?
							</AlertDialogTitle>
							<AlertDialogDescription className="text-muted-foreground font-medium">
								You are invoicing fewer units than originally quoted.
							</AlertDialogDescription>
						</div>
					</div>
				</AlertDialogHeader>

				<div className="bg-card space-y-4 px-8 py-4">
					<div className="bg-muted/30 border-muted-foreground/10 space-y-3 rounded-2xl border p-5">
						<p className="text-muted-foreground text-sm leading-relaxed font-medium">
							Would you like to transfer the remaining units to a{" "}
							<strong>new draft invoice</strong> for later delivery?
						</p>
					</div>

					<div className="bg-primary/10 border-primary/10 text-primary flex items-center gap-2 rounded-xl border p-3 text-[11px] font-medium">
						<InfoCircle size={14} variant="Bold" className="shrink-0" />
						Choosing &quot;No&quot; will consider the quoted lines as fully fulfilled.
					</div>
				</div>

				<AlertDialogFooter className="bg-muted/20 gap-3 border-t p-6 sm:gap-2">
					<AlertDialogCancel
						onClick={() => onConfirm(false)}
						className="border-muted-foreground/20 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 h-12 flex-1 rounded-2xl font-bold transition-all duration-200"
					>
						No, Finish Billing
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => onConfirm(true)}
						className="zen-glow-teal h-12 flex-1 rounded-2xl font-black shadow-lg"
					>
						Yes, Create Backorder
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
