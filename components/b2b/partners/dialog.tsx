"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	createPartnerAction,
	updatePartnerAction,
} from "@/lib/actions/b2b/partners";
import { type B2BPartner } from "@/lib/types/b2b";

import { Buildings, Edit2, Refresh } from "iconsax-reactjs";
import { toast } from "sonner";

interface PartnerDialogProps {
	children?: React.ReactNode;
	// Edit mode: pass an existing partner.
	partner?: B2BPartner;
	// Controlled mode (used when the trigger lives inside a dropdown menu).
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function PartnerDialog({
	children,
	partner,
	open: controlledOpen,
	onOpenChange: controlledOnOpenChange,
}: PartnerDialogProps) {
	const router = useRouter();
	const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen : uncontrolledOpen;
	const setOpen = isControlled
		? controlledOnOpenChange ?? (() => {})
		: setUncontrolledOpen;

	const isEdit = !!partner;
	// useActionState wants a stable signature, so pre-bind the partner id for
	// edit mode and fall back to create otherwise.
	const boundAction = isEdit
		? updatePartnerAction.bind(null, partner.id)
		: createPartnerAction;
	const [state, action, isPending] = useActionState(boundAction, null);

	useEffect(() => {
		if (state?.success) {
			toast.success(isEdit ? "Partner updated" : "Partner created");
			startTransition(() => {
				setOpen(false);
				router.refresh();
			});
		}
	}, [state, isEdit, router, setOpen]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
			<DialogContent className="rounded-3xl border shadow-2xl sm:max-w-lg">
				<DialogHeader>
					<div className="mb-4 flex items-center gap-4">
						<Avatar className="border-primary/20 bg-primary/10 text-primary h-14 w-14 rounded-2xl border shadow-inner">
							<AvatarFallback className="rounded-2xl bg-transparent">
								{isEdit ? (
									<Edit2 size={26} variant="Bulk" />
								) : (
									<Buildings size={28} variant="Bulk" />
								)}
							</AvatarFallback>
						</Avatar>
						<div>
							<DialogTitle className="font-heading text-foreground text-2xl font-bold">
								{isEdit ? "Edit Partner" : "Add a Partner"}
							</DialogTitle>
							<DialogDescription className="text-muted-foreground/80 font-medium">
								{isEdit
									? "Update this partner's company details."
									: "Create a new company profile for your B2B services."}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>
				<form action={action} className="grid gap-5 py-4">
					<div className="grid gap-2">
						<Label htmlFor="companyName" className="text-sm font-semibold">
							Company Name
						</Label>
						<Input
							id="companyName"
							name="companyName"
							placeholder="ex: Hotel Villa Taj"
							defaultValue={partner?.companyName ?? ""}
							required
							className="bg-secondary/5 focus-visible:ring-primary/20 border"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="taxId" className="text-sm font-semibold">
							Tax ID / ICE
						</Label>
						<Input
							id="taxId"
							name="taxId"
							placeholder="ex: 001524300000089"
							defaultValue={partner?.taxId ?? ""}
							className="bg-secondary/5 focus-visible:ring-primary/20 border font-mono"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="address" className="text-sm font-semibold">
							Address
						</Label>
						<Input
							id="address"
							name="address"
							placeholder="Marrakech, Morocco"
							defaultValue={partner?.address ?? ""}
							className="bg-secondary/5 focus-visible:ring-primary/20 border"
						/>
					</div>
					{state?.error ? (
						<div className="border-destructive/20 bg-destructive/5 text-destructive space-y-1 rounded-xl border p-3 text-sm font-medium">
							<p className="font-bold">{state.error}</p>
							{state.issues
								? Object.values(state.issues)
										.flat()
										.map((issue, i) => (
											<p key={i} className="text-xs opacity-80">
												• {issue}
											</p>
										))
								: null}
						</div>
					) : null}
					<DialogFooter className="mt-2">
						<Button
							type="submit"
							disabled={isPending}
							className="w-full font-medium shadow-sm transition-all active:scale-95 sm:w-auto"
						>
							{isPending ? (
								<Refresh size={16} className="mr-2 animate-spin" />
							) : null}
							{isEdit ? "Save Changes" : "Create Partner"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
