"use client";

import { startTransition, useActionState, useEffect, useId, useState } from "react";
import { getCountries } from "react-phone-number-input";

import { FormSheet } from "@/components/form-sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { createContactAction, updateContactAction } from "@/lib/actions/b2b/partners";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { type Contact } from "@/lib/types";

import { Edit2, Refresh, UserAdd } from "iconsax-reactjs";

interface ContactDialogProps {
	partnerId: string;
	children?: React.ReactNode;
	// Edit mode: pass an existing contact.
	contact?: Contact;
	// Controlled mode (used when the trigger lives inside a dropdown menu).
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	/** After a successful save (the document editor refreshes its contacts). */
	onSaved?: () => void;
}

export function ContactDialog({
	partnerId,
	children,
	contact,
	open: controlledOpen,
	onOpenChange: controlledOnOpenChange,
	onSaved,
}: ContactDialogProps) {
	const formId = useId();
	const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen : uncontrolledOpen;
	const setOpen = isControlled
		? controlledOnOpenChange ?? (() => {})
		: setUncontrolledOpen;

	const isEdit = !!contact;
	const boundAction = isEdit
		? updateContactAction.bind(null, contact.id)
		: createContactAction;
	const [state, action, isPending] = useActionState(boundAction, null);
	const [phone, setPhone] = useState<string>(contact?.phone ?? "");
	// Only show an error for a submit made since the sheet was opened.
	const [submitted, setSubmitted] = useState(false);

	useEffect(() => {
		if (state?.success) {
			if (state.warning) notify.warning(isEdit ? "Contact updated" : "Contact added", state.warning);
			else notify.success(isEdit ? "Contact updated" : "Contact added");
			startTransition(() => setOpen(false));
			onSaved?.();
		} else if (state?.ref) {
			notifyActionError(state, isEdit ? "Couldn't update this contact" : "Couldn't add this contact");
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state]);

	return (
		<FormSheet
			open={open}
			onOpenChange={(next) => {
				if (next) {
					setSubmitted(false);
					setPhone(contact?.phone ?? "");
				}
				setOpen(next);
			}}
			trigger={children}
			busy={isPending}
			icon={isEdit ? <Edit2 size={26} variant="Bulk" /> : <UserAdd size={28} variant="Bulk" />}
			title={isEdit ? "Edit Contact" : "New Contact"}
			description={
				isEdit
					? "Changes are pushed to Google Contacts too."
					: "Automatically synced with Google Contacts."
			}
			footer={
				<Button
					type="submit"
					form={formId}
					disabled={isPending}
					className="h-11 rounded-xl font-bold shadow-sm transition-all active:scale-95"
				>
					{isPending ? <Refresh size={16} className="mr-2 animate-spin" /> : null}
					{isEdit ? "Save Changes" : "Create Contact"}
				</Button>
			}
		>
			<form
				id={formId}
				action={action}
				onSubmit={() => setSubmitted(true)}
				className="grid gap-5 py-2"
			>
				<input type="hidden" name="partnerId" value={partnerId} />
				<div className="grid gap-2">
					<Label htmlFor={`${formId}-fullName`} className="text-sm font-semibold">Full Name</Label>
					<Input
						id={`${formId}-fullName`}
						name="fullName"
						placeholder="ex: Jean Dupont"
						defaultValue={contact?.fullName ?? ""}
						required
						className="bg-secondary/5 focus-visible:ring-primary/20 border"
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor={`${formId}-role`} className="text-sm font-semibold">
						Job Title / Role
					</Label>
					<Input
						id={`${formId}-role`}
						name="role"
						placeholder="ex: Manager, Front Desk"
						defaultValue={contact?.role ?? ""}
						className="bg-secondary/5 focus-visible:ring-primary/20 border"
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor={`${formId}-email`} className="text-sm font-semibold">
						Email
					</Label>
					<Input
						id={`${formId}-email`}
						name="email"
						type="email"
						placeholder="email@exemple.com"
						defaultValue={contact?.email ?? ""}
						className="bg-secondary/5 focus-visible:ring-primary/20 border"
					/>
				</div>
				<div className="grid gap-2">
					<Label className="text-sm font-semibold">Phone</Label>
					<input type="hidden" name="phone" value={phone} />
					<PhoneInput
						placeholder="+212 6 12 34 56 78"
						defaultCountry="MA"
						countries={getCountries().filter((country) => country !== "IL" && country !== "EH")}
						value={phone}
						onChange={(value) => setPhone(value ?? "")}
						disabled={isPending}
						className="h-10"
					/>
				</div>
				<div className="border-primary/40 bg-primary/5 hover:bg-primary/10 flex items-center space-x-3 rounded-2xl border p-4 shadow-xs transition-colors">
					<Checkbox
						id={`${formId}-isPrimary`}
						name="isPrimary"
						defaultChecked={contact?.isPrimary ?? false}
						className="border-primary/80 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
					/>
					<div className="grid gap-1 leading-none">
						<Label htmlFor={`${formId}-isPrimary`} className="text-primary cursor-pointer text-sm font-bold">
							Primary Contact
						</Label>
						<p className="text-secondary-foreground text-[11px] leading-tight font-medium">
							The default recipient for documents. Only one per partner.
						</p>
					</div>
				</div>

				{submitted && state?.error && !state.ref ? (
					<div className="border-destructive/20 bg-destructive/5 text-destructive space-y-1 rounded-xl border p-3 text-sm font-medium">
						<p className="font-bold">{state.error}</p>
						{state.issues ? Object.values(state.issues).flat().map((issue, i) => (
							<p key={i} className="text-xs opacity-80">• {issue}</p>
						)) : null}
					</div>
				) : null}
			</form>
		</FormSheet>
	);
}
