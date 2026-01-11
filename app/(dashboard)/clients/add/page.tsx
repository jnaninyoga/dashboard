"use client";

import { useActionState } from "react";
import { createClientAction } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const initialState = {
	error: "",
	issues: {} as any,
};

export default function AddClientPage() {
	const [state, formAction, isPending] = useActionState(
		createClientAction,
		initialState
	);

	return (
		<div className="flex justify-center items-start min-h-screen p-6">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Add New Client</CardTitle>
					<CardDescription>
						Add a client to the database. This will also create a contact in
						Google Contacts.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={formAction} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="fullName">Full Name</Label>
							<Input
								id="fullName"
								name="fullName"
								placeholder="Jane Doe"
								required
							/>
							{state?.issues?.fullName && (
								<p className="text-sm text-red-500">
									{state.issues.fullName._errors[0]}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="phone">Phone Number</Label>
							<Input
								id="phone"
								name="phone"
								type="tel"
								placeholder="+1234567890"
								required
							/>
							{state?.issues?.phone && (
								<p className="text-sm text-red-500">
									{state.issues.phone._errors[0]}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="birthDate">Birth Date</Label>
							<Input id="birthDate" name="birthDate" type="date" required />
							{state?.issues?.birthDate && (
								<p className="text-sm text-red-500">
									{state.issues.birthDate._errors[0]}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="category">Category</Label>
							<div className="relative">
								<select
									id="category"
									name="category"
									className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									defaultValue="Adult"
								>
									<option value="Adult">Adult</option>
									<option value="Child">Child</option>
									<option value="Student">Student</option>
								</select>
							</div>
						</div>

						{state?.error && (
							<div className="p-3 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
								{state.error}
							</div>
						)}

						<Button type="submit" className="w-full" disabled={isPending}>
							{isPending ? "Creating..." : "Create Client"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
