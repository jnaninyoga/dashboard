"use client";

import { UseFormReturn, useWatch } from "react-hook-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { ClientFormValues } from "@/lib/validators";

interface StepConsultationProps {
	form: UseFormReturn<ClientFormValues>;
}

export function StepConsultation({ form }: StepConsultationProps) {
	const values = useWatch({ control: form.control });
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Consultation Notes</CardTitle>
					<CardDescription>
						Additional context or specific reasons for this visit.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<FormField
						control={form.control}
						name="consultationReason"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Reason for Consultation</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Why are they visiting?"
										className="resize-none min-h-[120px]"
										{...field}
										value={field.value ?? ""}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</CardContent>
			</Card>

			{/* Summary Preview */}
			<Card className="border-dashed">
				<CardHeader>
					<CardTitle className="text-lg">Review Summary</CardTitle>
					<CardDescription>
						Please review the information before creating the profile.
					</CardDescription>
				</CardHeader>
				<CardContent className="text-sm space-y-2">
					<p>
						<strong>Name:</strong> {values.fullName || "—"}
					</p>
					<p>
						<strong>Birth Date:</strong> {values.birthDate || "—"}
					</p>
					<p>
						<strong>Phone:</strong> {values.phone || "—"}
					</p>
					<p>
						<strong>Email:</strong> {values.email || "—"}
					</p>
					<p>
						<strong>Category:</strong> {values.category || "—"}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
