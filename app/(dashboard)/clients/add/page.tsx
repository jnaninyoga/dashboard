"use client";

import { useTransition, useState } from "react";
import { createClientAction } from "@/lib/actions/clients";
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
import { Loader2, Plus, AlertCircle, CalendarIcon } from "lucide-react";
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
import { HEALTH_TEMPLATE } from "@/config/health";

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

export default function AddClientPage() {
	const [isPending, startTransition] = useTransition();
	const [serverError, setServerError] = useState<string | null>(null);
	const router = useRouter();

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
			intakeData: {}, // Dynamic keys will be populated by user input
		},
	});

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

			// Intake Data Mapping: Flatten dynamic fields onto FormData for helper to read
			if (values.intakeData) {
				Object.entries(values.intakeData).forEach(([key, val]) => {
					if (val) formData.append(key, val);
				});
			}

			const result = await createClientAction(null, formData);

			if (result?.error) {
				setServerError(result.error);
			} else {
				router.push("/clients");
			}
		});
	}

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
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					{/* Bento Grid Layout - Responsive columns */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
						
						{/* Card 1: Identity & Contact */}
						<Card className="col-span-1 row-span-2">
							<CardHeader>
								<CardTitle>Identity & Contact</CardTitle>
								<CardDescription>
									Basic information to identify and contact the client.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<FormField
									control={form.control}
									name="fullName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
											<FormControl>
												<Input placeholder="e.g. Jane Doe" {...field} value={field.value ?? ""} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="grid grid-cols-2 gap-4">
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
														<SelectTrigger>
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
								</div>
								
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
										<FormItem>
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

						{/* Card 2: Professional Context */}
						<Card className="col-span-1">
							<CardHeader>
								<CardTitle>Professional Context</CardTitle>
								<CardDescription>
									Status and referral details.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<FormField
									control={form.control}
									name="category"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Category</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger>
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
										<FormItem>
											<FormLabel>Referral Source</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger>
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

						{/* Dynamic Health Questionnaire Cards - Directly in grid */}
						{HEALTH_TEMPLATE.map((section, idx) => (
							<Card key={section.category + idx} className="col-span-1">
								<CardHeader>
									<CardTitle>{section.label}</CardTitle>
									<CardDescription className="capitalize">{section.category} Assessment</CardDescription>
								</CardHeader>
								<CardContent className="grid gap-4">
									{section.fields.map((healthField) => (
										<FormField
											key={healthField.key}
											control={form.control}
											name={`intakeData.${healthField.key}`}
											render={({ field }) => (
												<FormItem className={healthField.type === 'textarea' ? "col-span-1" : ""}>
													<FormLabel>{healthField.label}</FormLabel>
													<FormControl>
														{healthField.type === 'select' ? (
															<Select onValueChange={field.onChange} defaultValue={field.value}>
																<SelectTrigger>
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
						))}

						{/* Full width card for Consultation Reason */}
						<Card className="col-span-1 md:col-span-2 lg:col-span-3">
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
													className="resize-none min-h-[100px]" 
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

					</div>
					
					{/* Footer Actions */}
					<div className="flex justify-end gap-4 pt-4 pb-8">
						<Button variant="outline" type="button" onClick={() => window.history.back()}>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending} className="min-w-[150px]">
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
								</>
							) : (
								<>
									<Plus className="mr-2 h-4 w-4" /> Create Profile
								</>
							)}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
