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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ClientFormValues } from "@/lib/validators";
import { type HealthSection } from "@/config/health";

interface StepHealthWellnessProps {
	form: UseFormReturn<ClientFormValues>;
	sections: HealthSection[];
}

export function StepHealthWellness({
	form,
	sections,
}: StepHealthWellnessProps) {
	return (
		<div className="space-y-6">
			{sections.map((section) => (
				<Card key={section.category + section.label} className="mb-6">
					<CardHeader>
						<CardTitle className="text-lg">{section.label}</CardTitle>
						<CardDescription>{section.label} Assessment</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2">
						{section.fields.map((healthField) => (
							<FormField
								key={healthField.key}
								control={form.control}
								name={`intakeData.${healthField.key}`}
								render={({ field }) => (
									<FormItem
										className={
											healthField.type === "textarea" ? "sm:col-span-2" : ""
										}
									>
										<FormLabel>{healthField.label}</FormLabel>
										<FormControl>
											{healthField.type === "select" ? (
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select..." />
													</SelectTrigger>
													<SelectContent>
														{healthField.options?.map((opt) => (
															<SelectItem key={opt} value={opt}>
																{opt}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											) : healthField.type === "textarea" ? (
												<Textarea
													placeholder={healthField.placeholder}
													className="resize-none min-h-[80px]"
													{...field}
													value={field.value ?? ""}
												/>
											) : (
												<Input
													placeholder={healthField.placeholder}
													{...field}
													value={field.value ?? ""}
												/>
											)}
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						))}
					</CardContent>
				</Card>
			))}
		</div>
	);
}
