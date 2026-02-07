"use client";

import { UseFormReturn } from "react-hook-form";
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
						<strong>Name:</strong> {form.watch("fullName") || "—"}
					</p>
					<p>
						<strong>Birth Date:</strong> {form.watch("birthDate") || "—"}
					</p>
					<p>
						<strong>Phone:</strong> {form.watch("phone") || "—"}
					</p>
					<p>
						<strong>Email:</strong> {form.watch("email") || "—"}
					</p>
					<p>
						<strong>Category:</strong> {form.watch("category") || "—"}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
