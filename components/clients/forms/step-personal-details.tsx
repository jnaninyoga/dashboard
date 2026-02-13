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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isValid } from "date-fns";
import type { ClientFormValues } from "@/lib/validators";
import { ClientCategory, Gender, ReferralSource } from "@/lib/types";

interface StepPersonalDetailsProps {
	form: UseFormReturn<ClientFormValues>;
}

export function StepPersonalDetails({ form }: StepPersonalDetailsProps) {
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Identity & Contact</CardTitle>
					<CardDescription>
						Basic information to identify and contact the client.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-2">
					<FormField
						control={form.control}
						name="fullName"
						render={({ field }) => (
							<FormItem className="sm:col-span-2">
								<FormLabel>
									Full Name <span className="text-destructive">*</span>
								</FormLabel>
								<FormControl>
									<Input
										placeholder="e.g. Jane Doe"
										{...field}
										value={field.value ?? ""}
									/>
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
								<FormLabel>
									Birth Date <span className="text-destructive">*</span>
								</FormLabel>
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
												className={cn(
													"w-[40px] px-0",
													!field.value && "text-muted-foreground",
												)}
											>
												<CalendarIcon className="h-4 w-4" />
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="end">
											<Calendar
												mode="single"
												selected={
													field.value && isValid(new Date(field.value))
														? new Date(field.value)
														: undefined
												}
												onSelect={(date) => {
													if (date) field.onChange(format(date, "yyyy-MM-dd"));
												}}
												disabled={(date) =>
													date > new Date() || date < new Date("1900-01-01")
												}
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
						name="gender"
						render={({ field, fieldState }) => (
						<FormItem>
							<FormLabel>
								Gender <span className="text-destructive">*</span>
							</FormLabel>
							<Select
								onValueChange={field.onChange}
								defaultValue={field.value ?? undefined}
							>
								<FormControl>
									<SelectTrigger
										className={cn(
											"w-full",
											fieldState.error && "border-destructive",
										)}
									>
										<SelectValue placeholder="Select..." />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value={Gender.MALE}>Male</SelectItem>
									<SelectItem value={Gender.FEMALE}>Female</SelectItem>
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
								<FormLabel>
									Phone Number <span className="text-destructive">*</span>
								</FormLabel>
								<FormControl>
									<Input
										placeholder="+1 234 567 8900"
										type="tel"
										{...field}
										value={field.value ?? ""}
									/>
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
									<Input
										placeholder="jane@example.com"
										type="email"
										{...field}
										value={field.value ?? ""}
									/>
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
									<Textarea
										placeholder="e.g. 123 Yoga St."
										className="resize-none min-h-[80px]"
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
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select a category" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value={ClientCategory.ADULT}>Adult</SelectItem>
										<SelectItem value={ClientCategory.CHILD}>Child</SelectItem>
										<SelectItem value={ClientCategory.STUDENT}>Student</SelectItem>
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
									<Input
										placeholder="e.g. Teacher, Engineer"
										{...field}
										value={field.value ?? ""}
									/>
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
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value ?? undefined}
								>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="How did they hear about us?" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value={ReferralSource.SOCIAL_MEDIA}>Social Media</SelectItem>
										<SelectItem value={ReferralSource.WEBSITE}>Website</SelectItem>
										<SelectItem value={ReferralSource.FRIEND}>Friend</SelectItem>
										<SelectItem value={ReferralSource.PROFESSIONAL_NETWORK}>
											Professional Network
										</SelectItem>
										<SelectItem value={ReferralSource.OTHER}>Other</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
