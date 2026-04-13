"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { getCountries } from "react-phone-number-input";

import { createContactAction } from "@/actions/b2b/partners";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { PhoneInput } from "@/components/ui/phone-input";

import { Refresh, UserAdd } from "iconsax-reactjs";

export function ContactDialog({ partnerId, children }: { partnerId: string, children: React.ReactNode }) {
	const [open, setOpen] = useState(false);
	const [phone, setPhone] = useState<string>("");
	const [state, action, isPending] = useActionState(createContactAction, null);

	useEffect(() => {
		if (state?.success) {
			startTransition(() => {
				setOpen(false);
				setPhone("");
			});
		}
	}, [state]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="border-foreground/10 rounded-3xl shadow-2xl sm:max-w-lg">
				<DialogHeader>
					<div className="mb-4 flex items-center gap-4">
						<Avatar className="border-primary/20 bg-primary/10 text-primary h-14 w-14 rounded-2xl border shadow-inner">
							<AvatarFallback className="rounded-2xl bg-transparent">
								<UserAdd size={28} variant="Bulk" />
							</AvatarFallback>
						</Avatar>
						<div>
							<DialogTitle className="font-heading text-foreground text-2xl font-bold">New Contact</DialogTitle>
							<DialogDescription className="text-muted-foreground/80 font-medium">
								Automatically synced with Google Contacts.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>
				<form action={action} className="grid gap-5 py-4">
					<input type="hidden" name="partnerId" value={partnerId} />
					<div className="grid gap-2">
						<Label htmlFor="fullName" className="text-sm font-semibold">Full Name</Label>
						<Input
							id="fullName"
							name="fullName"
							placeholder="ex: Jean Dupont"
							required
							className="border-foreground/10 bg-secondary/5 focus-visible:ring-primary/20"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="role" className="text-sm font-semibold">
							Job Title / Role
						</Label>
						<Input
							id="role"
							name="role"
							placeholder="ex: Manager, Front Desk"
							className="border-foreground/10 bg-secondary/5 focus-visible:ring-primary/20"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="email" className="text-sm font-semibold">
							Email
						</Label>
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="email@exemple.com"
							className="border-foreground/10 bg-secondary/5 focus-visible:ring-primary/20"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="phone" className="text-sm font-semibold">
							Phone
						</Label>
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
							id="isPrimary"
							name="isPrimary"
							className="border-primary/80 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
						/>
						<div className="grid gap-1 leading-none">
							<Label htmlFor="isPrimary" className="text-primary cursor-pointer text-sm font-bold">
								Primary Contact
							</Label>
							<p className="text-secondary-foreground text-[11px] leading-tight font-medium">
								This contact will be the default recipient for documents.
							</p>
						</div>
					</div>

					{state?.error ? (
						<div className="border-destructive/20 bg-destructive/5 text-destructive space-y-1 rounded-xl border p-3 text-sm font-medium">
							<p className="font-bold">{state.error}</p>
							{state.issues ? Object.values(state.issues).flat().map((issue, i) => (
								<p key={i} className="text-xs opacity-80">• {issue}</p>
							)) : null}
						</div>
					) : null}
					<DialogFooter className="mt-2">
						<Button
							type="submit"
							disabled={isPending}
							className="w-full font-bold shadow-sm transition-all active:scale-95 sm:w-auto"
						>
							{isPending ? <Refresh size={16} className="mr-2 animate-spin" /> : null}
							Create Contact
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
