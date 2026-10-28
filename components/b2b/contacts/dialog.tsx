"use client";

import { startTransition, useActionState, useEffect, useId, useState } from "react";
import { getCountries } from "react-phone-number-input";

import { FormSheet } from "@/components/form-sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { createContactAction } from "@/lib/actions/b2b/partners";
import { notify, notifyActionError } from "@/lib/feedback/notify";

import { Refresh, UserAdd } from "iconsax-reactjs";

export function ContactDialog({ partnerId, children }: { partnerId: string, children: React.ReactNode }) {
	const formId = useId();
	const [open, setOpen] = useState(false);
	const [phone, setPhone] = useState<string>("");
	const [state, action, isPending] = useActionState(createContactAction, null);
	// Only show an error for a submit made since the sheet was opened.
	const [submitted, setSubmitted] = useState(false);

	useEffect(() => {
		if (state?.success) {
			notify.success("Contact added");
			startTransition(() => {
				setOpen(false);
				setPhone("");
			});
		} else if (state?.ref) {
			notifyActionError(state, "Couldn't add this contact");
		}
	}, [state]);

	return (
		<FormSheet
			open={open}
			onOpenChange={(next) => {
				if (next) setSubmitted(false);
				else setPhone("");
				setOpen(next);
			}}
			trigger={children}
			busy={isPending}
			icon={<UserAdd size={28} variant="Bulk" />}
			title="New Contact"
			description="Automatically synced with Google Contacts."
			footer={
				<Button
					type="submit"
					form={formId}
					disabled={isPending}
					className="h-11 rounded-xl font-bold shadow-sm transition-all active:scale-95"
				>
					{isPending ? <Refresh size={16} className="mr-2 animate-spin" /> : null}
					Create Contact
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
						onChange={setPhone}
						disabled={isPending}
						className="h-10"
					/>
				</div>
				<div className="border-primary/40 bg-primary/5 hover:bg-primary/10 flex items-center space-x-3 rounded-2xl border p-4 shadow-xs transition-colors">
					<Checkbox
						id={`${formId}-isPrimary`}
						name="isPrimary"
						className="border-primary/80 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
					/>
					<div className="grid gap-1 leading-none">
						<Label htmlFor={`${formId}-isPrimary`} className="text-primary cursor-pointer text-sm font-bold">
							Primary Contact
						</Label>
						<p className="text-secondary-foreground text-[11px] leading-tight font-medium">
							This contact will be the default recipient for documents.
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
