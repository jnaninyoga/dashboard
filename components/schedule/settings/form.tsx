"use client";

import { startTransition, useActionState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { setWorkingHours } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DAYS, DEFAULT_HOURS } from "@/lib/config/schedule";
import { type WorkingHoursConfig } from "@/lib/types";

import { zodResolver } from "@hookform/resolvers/zod";
import { Refresh as Loader2, TickCircle as Save } from "iconsax-reactjs";
import { toast } from "sonner";
import * as z from "zod";

const daySchema = z.object({
	isOpen: z.boolean(),
	start: z.string(),
	end: z.string(),
});

const scheduleSchema = z.record(z.string(), daySchema);

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

export function ScheduleForm({
	initialData,
}: {
	initialData: WorkingHoursConfig | null;
}) {
	const [, formAction, isPending] = useActionState(
		async (_: unknown, data: WorkingHoursConfig) => {
			try {
				await setWorkingHours(data);
				toast.success("Schedule updated successfully.");
				return { success: true };
			} catch (error) {
				console.error(error);
				toast.error("Failed to update schedule.");
				return { error: "Failed to update schedule." };
			}
		},
		null,
	);

	const { control, handleSubmit } = useForm<ScheduleFormValues>({
		resolver: zodResolver(scheduleSchema),
		defaultValues: initialData || DEFAULT_HOURS,
	});

	const formValues = useWatch({ control });

	const onSubmit = async (data: ScheduleFormValues) => {
		startTransition(() => {
			formAction(data as WorkingHoursConfig);
		});
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			<Card>
				<CardContent className="p-6">
					<div className="space-y-6">
						{DAYS.map((day) => {
							const isOpen = formValues?.[day.key]?.isOpen;

							return (
								<div
									key={day.key}
									className="bg-card flex flex-col justify-between gap-4 rounded-lg border p-4 sm:flex-row sm:items-center"
								>
									<div className="flex min-w-[140px] items-center gap-4">
										<Controller
											control={control}
											name={`${day.key}.isOpen`}
											render={({ field }) => (
												<Switch
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											)}
										/>
										<Label className="font-medium">{day.label}</Label>
									</div>

									<div className="flex items-center gap-2">
										<Controller
											control={control}
											name={`${day.key}.start`}
											render={({ field }) => (
												<Input
													type="time"
													{...field}
													disabled={!isOpen}
													className="w-[120px]"
												/>
											)}
										/>
										<span className="text-muted-foreground">-</span>
										<Controller
											control={control}
											name={`${day.key}.end`}
											render={({ field }) => (
												<Input
													type="time"
													{...field}
													disabled={!isOpen}
													className="w-[120px]"
												/>
											)}
										/>
									</div>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>

			<div className="flex justify-end">
				<Button
					type="submit"
					disabled={isPending}
					className="zen-glow-teal h-11 px-8 font-bold shadow-sm transition-all"
				>
					{isPending ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Save className="mr-2 h-4 w-4" />
					)}
					Save Schedule
				</Button>
			</div>
		</form>
	);
}
