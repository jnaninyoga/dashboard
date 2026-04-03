import { useFieldArray,UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type HealthSection } from "@/config/health";
import { HealthCategory, HealthSeverity } from "@/lib/types/health";
import type { ClientFormValues } from "@/lib/validators";

import { Add, Trash } from "iconsax-reactjs";

interface StepHealthWellnessProps {
	form: UseFormReturn<ClientFormValues>;
	sections: HealthSection[];
}

export function StepHealthWellness({
	form,
	sections,
}: StepHealthWellnessProps) {
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "healthLogs",
	});


	return (
		<div className="space-y-6">
			{sections.some((s) => s.category === "physical") ? (
				<Card className="border-l-primary mb-6 border-l-4">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							Active Health Conditions & Care
						</CardTitle>
						<CardDescription>
							List current injuries, pains, or medical conditions and their
							corresponding treatments.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{fields.map((field, index) => (
							<div
								key={field.id}
								className="bg-muted/20 grid grid-cols-1 items-start gap-4 rounded-lg border p-4 md:grid-cols-12"
							>
								<div className="grid grid-cols-1 gap-4 md:col-span-12 md:grid-cols-2">
									<FormField
										control={form.control}
										name={`healthLogs.${index}.condition`}
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-xs">
													Condition / Diagnosis
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														placeholder="e.g. Knee Pain, Hypertension..."
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name={`healthLogs.${index}.treatment`}
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-xs">
													Treatment / Care Plan
												</FormLabel>
												<FormControl>
													<Textarea
														{...field}
														placeholder="e.g. Physiotherapy twice a week, Medication X..."
														className="h-[38px] min-h-[38px] resize-none py-2"
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="md:col-span-11">
									<FormField
										control={form.control}
										name={`healthLogs.${index}.severity`}
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-xs">Severity</FormLabel>
												<FormControl>
													<RadioGroup
														onValueChange={(val) => {
															field.onChange(val);
															// Auto-set isAlert
															const isAlert =
																val === HealthSeverity.WARNING ||
																val === HealthSeverity.CRITICAL;
															form.setValue(
																`healthLogs.${index}.isAlert`,
																isAlert,
															);
															// Set category default
															form.setValue(
																`healthLogs.${index}.category`,
																HealthCategory.PHYSICAL,
															); // Default to physical
															// Set startDate
															if (
																!form.getValues(`healthLogs.${index}.startDate`)
															) {
																form.setValue(
																	`healthLogs.${index}.startDate`,
																	new Date().toISOString().split("T")[0],
																);
															}
														}}
														defaultValue={field.value}
														className="flex gap-2"
													>
														<FormItem className="flex items-center space-y-0 space-x-1">
															<FormControl>
																<RadioGroupItem value={HealthSeverity.INFO} />
															</FormControl>
															<FormLabel className="text-xs font-normal">
																Info
															</FormLabel>
														</FormItem>
														<FormItem className="flex items-center space-y-0 space-x-1 text-amber-600">
															<FormControl>
																<RadioGroupItem
																	value={HealthSeverity.WARNING}
																	className="border-amber-600 text-amber-600"
																/>
															</FormControl>
															<FormLabel className="text-xs font-normal">
																Warning
															</FormLabel>
														</FormItem>
														<FormItem className="flex items-center space-y-0 space-x-1 text-red-600">
															<FormControl>
																<RadioGroupItem
																	value={HealthSeverity.CRITICAL}
																	className="border-red-600 text-red-600"
																/>
															</FormControl>
															<FormLabel className="text-xs font-normal">
																Critical
															</FormLabel>
														</FormItem>
													</RadioGroup>
												</FormControl>
											</FormItem>
										)}
									/>
								</div>
								<div className="flex justify-end pt-6 md:col-span-1">
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => remove(index)}
										className="text-muted-foreground hover:text-destructive"
									>
										<Trash className="h-4 w-4" variant="Outline" />
									</Button>
								</div>
							</div>
						))}

						<Button
							type="button"
							variant="outline"
							size="sm"
							className="w-full border-dashed"
							onClick={() =>
								append({
									category: HealthCategory.PHYSICAL,
									condition: "",
									treatment: "",
									severity: HealthSeverity.INFO,
									isAlert: false,
									startDate: new Date().toISOString().split("T")[0],
								})
							}
						>
							<Add className="mr-2 h-4 w-4" variant="Outline" /> Add Condition
						</Button>
					</CardContent>
				</Card>
			) : null}

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
													className="min-h-[80px] resize-none"
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
