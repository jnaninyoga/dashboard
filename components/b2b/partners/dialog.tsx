"use client";

import { startTransition, useActionState, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";

import { FormSheet } from "@/components/form-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	createPartnerAction,
	updatePartnerAction,
} from "@/lib/actions/b2b/partners";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { type B2BPartner } from "@/lib/types/b2b";

import { Buildings, Edit2, Refresh } from "iconsax-reactjs";

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
	const formId = useId();
	const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen : uncontrolledOpen;
	const setOpen = isControlled
		? controlledOnOpenChange ?? (() => {})
		: setUncontrolledOpen;
	// The action's last result outlives the sheet; only show its error for a
	// submit made since the sheet was opened.
	const [submitted, setSubmitted] = useState(false);

	const isEdit = !!partner;
	// useActionState wants a stable signature, so pre-bind the partner id for
	// edit mode and fall back to create otherwise.
	const boundAction = isEdit
		? updatePartnerAction.bind(null, partner.id)
		: createPartnerAction;
	const [state, action, isPending] = useActionState(boundAction, null);

	useEffect(() => {
		if (state?.success) {
			notify.success(isEdit ? "Partner updated" : "Partner created");
			startTransition(() => {
				setOpen(false);
				router.refresh();
			});
		} else if (state?.ref) {
			notifyActionError(state, "Couldn't save this partner");
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state]);

	return (
		<FormSheet
			open={open}
			onOpenChange={(next) => {
				if (next) setSubmitted(false);
				setOpen(next);
			}}
			trigger={children}
			busy={isPending}
			icon={
				isEdit ? (
					<Edit2 size={26} variant="Bulk" />
				) : (
					<Buildings size={28} variant="Bulk" />
				)
			}
			title={isEdit ? "Edit Partner" : "Add a Partner"}
			description={
				isEdit
					? "Update this partner's company details."
					: "Create a new company profile for your B2B services."
			}
			footer={
				<Button
					type="submit"
					form={formId}
					disabled={isPending}
					className="h-11 rounded-xl font-medium shadow-sm transition-all active:scale-95"
				>
					{isPending ? <Refresh size={16} className="mr-2 animate-spin" /> : null}
					{isEdit ? "Save Changes" : "Create Partner"}
				</Button>
			}
		>
			<form
				id={formId}
				action={action}
				onSubmit={() => setSubmitted(true)}
				className="grid gap-5 py-2"
			>
				<div className="grid gap-2">
					<Label htmlFor={`${formId}-companyName`} className="text-sm font-semibold">
						Company Name
					</Label>
					<Input
						id={`${formId}-companyName`}
						name="companyName"
						placeholder="ex: Hotel Villa Taj"
						defaultValue={partner?.companyName ?? ""}
						required
						className="border bg-secondary/5 focus-visible:ring-primary/20"
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor={`${formId}-taxId`} className="text-sm font-semibold">
						Tax ID / ICE
					</Label>
					<Input
						id={`${formId}-taxId`}
						name="taxId"
						placeholder="ex: 001524300000089"
						defaultValue={partner?.taxId ?? ""}
						className="border bg-secondary/5 font-mono focus-visible:ring-primary/20"
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor={`${formId}-address`} className="text-sm font-semibold">
						Address
					</Label>
					<Input
						id={`${formId}-address`}
						name="address"
						placeholder="Marrakech, Morocco"
						defaultValue={partner?.address ?? ""}
						className="border bg-secondary/5 focus-visible:ring-primary/20"
					/>
				</div>
				{submitted && state?.error && !state.ref ? (
					<div className="space-y-1 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm font-medium text-destructive">
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
			</form>
		</FormSheet>
	);
}
