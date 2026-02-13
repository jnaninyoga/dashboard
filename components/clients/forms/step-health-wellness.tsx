import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Plus, Trash2, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    RadioGroup,
    RadioGroupItem
} from "@/components/ui/radio-group";
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
import { HealthCategory, HealthSeverity } from "@/lib/types/health";

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
        // @ts-ignore
        name: "healthLogs",
    });

    const currentCareFields = [
        { label: 'Condition / Issue', value: '' },
    ];

    // Helper to get severity color
    const getSeverityColor = (sev: string) => {
        switch(sev) {
            case HealthSeverity.CRITICAL: return "bg-red-500 hover:bg-red-600";
            case HealthSeverity.WARNING: return "bg-amber-500 hover:bg-amber-600";
            default: return "bg-blue-500 hover:bg-blue-600";
        }
    };

	return (
		<div className="space-y-6">
            {/* Dynamic Active Health Conditions Section (Only on Step 2 / first section) */}
            {sections.some(s => s.category === 'physical') && (
                <Card className="mb-6 border-l-4 border-l-primary">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            Active Health Conditions
                        </CardTitle>
                        <CardDescription>
                            List current injuries, pains, or medical conditions that require attention.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {fields.map((field, index) => (
                             <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 border rounded-lg bg-muted/20">
                                <div className="md:col-span-6">
                                    <FormField
                                        control={form.control}
                                        // @ts-ignore
                                        name={`healthLogs.${index}.condition`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Condition</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="e.g. Knee Pain, Hypertension..." />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="md:col-span-5">
                                     <FormField
                                        control={form.control}
                                        // @ts-ignore
                                        name={`healthLogs.${index}.severity`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Severity</FormLabel>
                                                <FormControl>
                                                    <RadioGroup 
                                                        onValueChange={(val) => {
                                                            field.onChange(val);
                                                            // Auto-set isAlert
                                                            const isAlert = val === HealthSeverity.WARNING || val === HealthSeverity.CRITICAL;
                                                            // @ts-ignore
                                                            form.setValue(`healthLogs.${index}.isAlert`, isAlert);
                                                            // Set category default
                                                            // @ts-ignore
                                                            form.setValue(`healthLogs.${index}.category`, HealthCategory.PHYSICAL); // Default to physical
                                                            // Set startDate
                                                            // @ts-ignore
                                                            if (!form.getValues(`healthLogs.${index}.startDate`)) {
                                                                // @ts-ignore
                                                                form.setValue(`healthLogs.${index}.startDate`, new Date().toISOString().split('T')[0]);
                                                            }
                                                        }}
                                                        defaultValue={field.value}
                                                        className="flex gap-2"
                                                    >
                                                        <FormItem className="flex items-center space-x-1 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value={HealthSeverity.INFO} />
                                                            </FormControl>
                                                            <FormLabel className="font-normal text-xs">Info</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-1 space-y-0 text-amber-600">
                                                            <FormControl>
                                                                <RadioGroupItem value={HealthSeverity.WARNING} className="text-amber-600 border-amber-600" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal text-xs">Warning</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-1 space-y-0 text-red-600">
                                                            <FormControl>
                                                                <RadioGroupItem value={HealthSeverity.CRITICAL} className="text-red-600 border-red-600" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal text-xs">Critical</FormLabel>
                                                        </FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="md:col-span-1 flex justify-end pt-6">
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => remove(index)}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                             </div>
                        ))}

                        <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="w-full border-dashed"
                            onClick={() => append({ 
                                category: HealthCategory.PHYSICAL, 
                                condition: "", 
                                severity: HealthSeverity.INFO, 
                                isAlert: false,
                                startDate: new Date().toISOString().split('T')[0] 
                            })}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add Condition
                        </Button>
                    </CardContent>
                </Card>
            )}

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
