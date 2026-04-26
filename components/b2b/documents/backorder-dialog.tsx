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
			<AlertDialogContent className="sm:max-w-[420px] rounded-4xl p-0 overflow-hidden border-none zen-shadow-2xl bg-card">
				<AlertDialogHeader className="p-8 pb-6 bg-card border-b">
					<div className="flex items-center gap-4 text-left">
						<div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 zen-teal-glow">
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

				<div className="space-y-4 bg-card px-8 py-4">
					<div className="bg-muted/30 rounded-2xl p-5 space-y-3 border border-muted-foreground/10">
						<p className="text-sm leading-relaxed text-muted-foreground font-medium">
							Would you like to transfer the remaining units to a{" "}
							<strong>new draft invoice</strong> for later delivery?
						</p>
					</div>

					<div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/10 rounded-xl text-[11px] text-primary font-medium">
						<InfoCircle size={14} variant="Bold" className="shrink-0" />
						Choosing "No" will consider the quoted lines as fully fulfilled.
					</div>
				</div>

				<AlertDialogFooter className="p-6 bg-muted/20 border-t gap-3 sm:gap-2">
					<AlertDialogCancel
						onClick={() => onConfirm(false)}
						className="flex-1 h-12 rounded-2xl font-bold border-muted-foreground/20 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all duration-200"
					>
						No, Finish Billing
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => onConfirm(true)}
						className="flex-1 zen-glow-teal h-12 rounded-2xl font-black shadow-lg"
					>
						Yes, Create Backorder
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
