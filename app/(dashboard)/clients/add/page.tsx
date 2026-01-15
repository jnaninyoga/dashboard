"use client";

import { useTransition, useState, useEffect } from "react";
import { createClientAction } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; 
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CalendarIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format, isValid } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { HEALTH_TEMPLATE, type HealthSection } from "@/config/health";
import { FormWizard, type WizardStep } from "@/components/form-wizard";

// Define the schema for the form
const formSchema = z.object({
	fullName: z.string().min(1, "Full Name is required"),
	email: z.string().email("Invalid email address").optional().or(z.literal("")),
	phone: z.string().min(1, "Phone Number is required"),
	address: z.string().optional().nullable(),
	profession: z.string().optional().nullable(),
	birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
	sex: z.enum(["male", "female"]).optional(),
	referralSource: z.enum(['social_media', 'website', 'friend', 'professional_network', 'other']).optional(),
	consultationReason: z.string().optional(),
	category: z.enum(["adult", "child", "student"]),
	intakeData: z.record(z.string(), z.string().optional()),
});

type FormValues = z.infer<typeof formSchema>;

// Wizard steps configuration
const WIZARD_STEPS: WizardStep[] = [
	{ id: "personal", title: "Personal Info", description: "Identity & Contact" },
	{ id: "health", title: "Health History", description: "Medical Background" },
	{ id: "wellness", title: "Wellness", description: "Lifestyle & Mental Health" },
	{ id: "consultation", title: "Consultation", description: "Notes & Submit" },
];

// Group health sections by wizard step
const getHealthSectionsByStep = (step: number): HealthSection[] => {
	switch (step) {
		case 1: // Health History
			return HEALTH_TEMPLATE.filter(s => 
				s.category === 'physical' || s.category === 'medical_history'
			);
		case 2: // Wellness Profile
			return HEALTH_TEMPLATE.filter(s => 
				s.category === 'mental' || s.category === 'lifestyle'
			);
		default:
			return [];
	}
};

export default function AddClientPage() {
	const [isPending, startTransition] = useTransition();
	const [serverError, setServerError] = useState<string | null>(null);
	const [currentStep, setCurrentStep] = useState(0);
	const router = useRouter();
    const STORAGE_KEY = "client-form-progress";

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			fullName: "",
			email: "",
			phone: "",
			address: "",
			profession: "",
			birthDate: "",
			category: "adult",
			sex: undefined,
			referralSource: undefined,
			consultationReason: "",
			intakeData: {},
		},
	});

    // Load saved progress on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const { values, step } = JSON.parse(saved);
                if (values) {
                    // Reset form with saved values, merging with defaults
                    form.reset({ ...form.getValues(), ...values });
                }
                if (typeof step === 'number') {
                    setCurrentStep(step);
                }
            } catch (e) {
                console.error("Failed to load saved form progress:", e);
            }
        }
    }, [form]);

    // Save progress on form changes or step changes
    useEffect(() => {
        const subscription = form.watch((values) => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                values,
                step: currentStep
            }));
        });
        
        // Also save when step changes explicitly (in case form didn't change)
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            values: form.getValues(),
            step: currentStep
        }));

        return () => subscription.unsubscribe();
    }, [form, currentStep]);

	// Define which fields to validate for each step
	const getStepFields = (step: number): (keyof FormValues)[] => {
		switch (step) {
			case 0: // Personal Info - required fields
				return ["fullName", "phone", "birthDate", "category"];
			case 1: // Health History - optional
				return [];
			case 2: // Wellness - optional
				return [];
			case 3: // Consultation - optional
				return [];
			default:
				return [];
		}
	};

	const handleNext = async () => {
		const fieldsToValidate = getStepFields(currentStep);
		
		if (fieldsToValidate.length > 0) {
			// Trigger validation for step fields
			const isValid = await form.trigger(fieldsToValidate);
			if (!isValid) return; // Don't proceed if validation fails
		}
		
		if (currentStep < WIZARD_STEPS.length - 1) {
			setCurrentStep(prev => prev + 1);
		}
	};

	const handleBack = () => {
		if (currentStep > 0) {
			setCurrentStep(prev => prev - 1);
		}
	};

	function onSubmit(values: FormValues) {
		setServerError(null);
		startTransition(async () => {
			const formData = new FormData();
			
			// Top level fields
			formData.append("fullName", values.fullName);
			formData.append("phone", values.phone);
			if (values.email) formData.append("email", values.email);
			if (values.address) formData.append("address", values.address);
			if (values.profession) formData.append("profession", values.profession);
			formData.append("birthDate", values.birthDate || "");
			formData.append("category", values.category || "adult");
			if (values.sex) formData.append("sex", values.sex);
			if (values.referralSource) formData.append("referralSource", values.referralSource);
			if (values.consultationReason) formData.append("consultationReason", values.consultationReason);

			// Intake Data Mapping
			if (values.intakeData) {
				Object.entries(values.intakeData).forEach(([key, val]) => {
					if (val) formData.append(key, val);
				});
			}

			const result = await createClientAction(null, formData);

			if (result?.error) {
				setServerError(result.error);
			} else {
                localStorage.removeItem(STORAGE_KEY);
				router.push("/clients");
			}
		});
	}

	// Render health fields for a section
	const renderHealthFields = (section: HealthSection) => (
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
							<FormItem className={healthField.type === 'textarea' ? "sm:col-span-2" : ""}>
								<FormLabel>{healthField.label}</FormLabel>
								<FormControl>
									{healthField.type === 'select' ? (
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select..." />
											</SelectTrigger>
											<SelectContent>
												{healthField.options?.map(opt => (
													<SelectItem key={opt} value={opt}>{opt}</SelectItem>
												))}
											</SelectContent>
										</Select>
									) : healthField.type === 'textarea' ? (
										<Textarea placeholder={healthField.placeholder} className="resize-none min-h-[80px]" {...field} value={field.value ?? ""} />
									) : (
										<Input placeholder={healthField.placeholder} {...field} value={field.value ?? ""} />
									)}
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				))}
			</CardContent>
		</Card>
	);

	return (
		<div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
			<div className="flex items-center justify-between space-y-2">
				<h2 className="text-3xl font-bold tracking-tight">Add New Client</h2>
				<div className="flex items-center space-x-2">
					<Button variant="outline" onClick={() => window.history.back()}>Cancel</Button>
				</div>
			</div>
			
			{serverError && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{serverError}</AlertDescription>
				</Alert>
			)}

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<FormWizard
						steps={WIZARD_STEPS}
						currentStep={currentStep}
						onNext={handleNext}
						onBack={handleBack}
						onSubmit={form.handleSubmit(onSubmit)}
						isSubmitting={isPending}
					>
						{/* Step 1: Personal Information */}
						{currentStep === 0 && (
							<div className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle>Identity & Contact</CardTitle>
										<CardDescription>Basic information to identify and contact the client.</CardDescription>
									</CardHeader>
									<CardContent className="grid gap-4 sm:grid-cols-2">
										<FormField
											control={form.control}
											name="fullName"
											render={({ field }) => (
												<FormItem className="sm:col-span-2">
													<FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
													<FormControl>
														<Input placeholder="e.g. Jane Doe" {...field} value={field.value ?? ""} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="birthDate"
											render={({ field }) => (
												<FormItem className="flex flex-col">
													<FormLabel>Birth Date <span className="text-destructive">*</span></FormLabel>
													<div className="flex gap-2">
														<FormControl>
															<Input 
																placeholder="YYYY-MM-DD" 
																{...field} 
																value={field.value ?? ""} 
																onChange={(e) => field.onChange(e.target.value)}
															/>
														</FormControl>
														<Popover>
															<PopoverTrigger asChild>
																<Button
																	variant={"outline"}
																	className={cn("w-[40px] px-0", !field.value && "text-muted-foreground")}
																>
																	<CalendarIcon className="h-4 w-4" />
																</Button>
															</PopoverTrigger>
															<PopoverContent className="w-auto p-0" align="end">
																<Calendar
																	mode="single"
																	selected={field.value && isValid(new Date(field.value)) ? new Date(field.value) : undefined}
																	onSelect={(date) => {
																		if (date) field.onChange(format(date, "yyyy-MM-dd"));
																	}}
																	disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
																	autoFocus
																	captionLayout="dropdown"
																	fromYear={1900}
																	toYear={new Date().getFullYear()}
																/>
															</PopoverContent>
														</Popover>
													</div>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="sex"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Sex</FormLabel>
													<Select onValueChange={field.onChange} defaultValue={field.value}>
														<FormControl>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Select..." />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="male">Male</SelectItem>
															<SelectItem value="female">Female</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="phone"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Phone Number <span className="text-destructive">*</span></FormLabel>
													<FormControl>
														<Input placeholder="+1 234 567 8900" type="tel" {...field} value={field.value ?? ""} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="email"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Email Address</FormLabel>
													<FormControl>
														<Input placeholder="jane@example.com" type="email" {...field} value={field.value ?? ""} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="address"
											render={({ field }) => (
												<FormItem className="sm:col-span-2">
													<FormLabel>Address</FormLabel>
													<FormControl>
														<Textarea placeholder="e.g. 123 Yoga St." className="resize-none min-h-[80px]" {...field} value={field.value ?? ""} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Professional Context</CardTitle>
										<CardDescription>Status and referral details.</CardDescription>
									</CardHeader>
									<CardContent className="grid gap-4 sm:grid-cols-2">
										<FormField
											control={form.control}
											name="category"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Category</FormLabel>
													<Select onValueChange={field.onChange} defaultValue={field.value}>
														<FormControl>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Select a category" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="adult">Adult</SelectItem>
															<SelectItem value="child">Child</SelectItem>
															<SelectItem value="student">Student</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="profession"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Profession</FormLabel>
													<FormControl>
														<Input placeholder="e.g. Teacher, Engineer" {...field} value={field.value ?? ""} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="referralSource"
											render={({ field }) => (
												<FormItem className="sm:col-span-2">
													<FormLabel>Referral Source</FormLabel>
													<Select onValueChange={field.onChange} defaultValue={field.value}>
														<FormControl>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="How did they hear about us?" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="social_media">Social Media</SelectItem>
															<SelectItem value="website">Website</SelectItem>
															<SelectItem value="friend">Friend</SelectItem>
															<SelectItem value="professional_network">Professional Network</SelectItem>
															<SelectItem value="other">Other</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
									</CardContent>
								</Card>
							</div>
						)}

						{/* Step 2: Health History */}
						{currentStep === 1 && (
							<div className="space-y-6">
								{getHealthSectionsByStep(1).map(renderHealthFields)}
							</div>
						)}

						{/* Step 3: Wellness Profile */}
						{currentStep === 2 && (
							<div className="space-y-6">
								{getHealthSectionsByStep(2).map(renderHealthFields)}
							</div>
						)}

						{/* Step 4: Consultation */}
						{currentStep === 3 && (
							<div className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle>Consultation Notes</CardTitle>
										<CardDescription>Additional context or specific reasons for this visit.</CardDescription>
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
										<CardDescription>Please review the information before creating the profile.</CardDescription>
									</CardHeader>
									<CardContent className="text-sm space-y-2">
										<p><strong>Name:</strong> {form.watch("fullName") || "—"}</p>
										<p><strong>Birth Date:</strong> {form.watch("birthDate") || "—"}</p>
										<p><strong>Phone:</strong> {form.watch("phone") || "—"}</p>
										<p><strong>Email:</strong> {form.watch("email") || "—"}</p>
										<p><strong>Category:</strong> {form.watch("category") || "—"}</p>
									</CardContent>
								</Card>
							</div>
						)}
					</FormWizard>
				</form>
			</Form>
		</div>
	);
}
