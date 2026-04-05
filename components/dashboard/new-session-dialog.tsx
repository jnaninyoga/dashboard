"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { ScheduleEventInput, scheduleNewEventAction } from "@/actions/schedule";
import { getB2BPricingTiers } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { type B2BPricingTier } from "@/drizzle/schema";

import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse } from "date-fns";
import { Refresh } from "iconsax-reactjs";
import { toast } from "sonner";
import * as z from "zod";

const sessionSchema = z
	.object({
		title: z.string().min(1, "Title is required"),
		dateStr: z.string().min(1, "Date is required"),
		startTimeStr: z.string().min(1, "Start time is required"),
		endTimeStr: z.string().min(1, "End time is required"),
		type: z.enum(["group", "private", "outdoor", "b2b"]),
		outdoorPrice: z.string().optional(),
		b2bTierId: z.string().optional(),
	})
	.refine(
		(data) => {
			return data.startTimeStr < data.endTimeStr;
		},
		{
			message: "End time must be after start time",
			path: ["endTimeStr"],
		},
	)
	.refine(
		(data) => {
			if (
				data.type === "outdoor" &&
				(!data.outdoorPrice || isNaN(Number(data.outdoorPrice)))
			) {
				return false;
			}
			return true;
		},
		{
			message: "Valid price is required for outdoor sessions",
			path: ["outdoorPrice"],
		},
	)
	.refine(
		(data) => {
			if (data.type === "b2b" && !data.b2bTierId) {
				return false;
			}
			return true;
		},
		{
			message: "Pricing tier is required for B2B sessions",
			path: ["b2bTierId"],
		},
	);

type SessionFormValues = z.infer<typeof sessionSchema>;

export function NewSessionDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [tiers, setTiers] = useState<B2BPricingTier[]>([]);
	const router = useRouter();

	const [state, formAction, isPending] = useActionState(
		async (_: any, payload: ScheduleEventInput) => {
			return await scheduleNewEventAction(payload);
		},
		null,
	);

	const {
		control,
		handleSubmit,
		watch,
		reset,
		formState: { errors },
	} = useForm<SessionFormValues>({
		resolver: zodResolver(sessionSchema),
		defaultValues: {
			title: "",
			dateStr: format(new Date(), "yyyy-MM-dd"),
			startTimeStr: "08:00",
			endTimeStr: "09:00",
			type: "group",
			outdoorPrice: "",
			b2bTierId: "",
		},
	});

	useEffect(() => {
		if (open) {
			getB2BPricingTiers().then(setTiers);
		}
	}, [open]);

	useEffect(() => {
		if (state?.success) {
			toast.success("Session scheduled successfully!");
			reset();
			onOpenChange(false);
			router.refresh();
		} else if (state?.error) {
			toast.error(state.error);
		}
	}, [state, reset, onOpenChange, router]);

	const selectedType = watch("type");

	const onSubmit = async (data: SessionFormValues) => {
		try {
			const startDateTime = parse(
				`${data.dateStr} ${data.startTimeStr}`,
				"yyyy-MM-dd HH:mm",
				new Date(),
			);
			const endDateTime = parse(
				`${data.dateStr} ${data.endTimeStr}`,
				"yyyy-MM-dd HH:mm",
				new Date(),
			);

			const weekday = startDateTime.getDay();
			const parsePrice =
				data.type === "outdoor" && data.outdoorPrice
					? Number(data.outdoorPrice)
					: null;

			let b2bPrice = null;
			let b2bPaxLabel = null;

			if (data.type === "b2b" && data.b2bTierId) {
				const tier = tiers.find((t) => t.id === data.b2bTierId);
				if (tier) {
					b2bPrice = tier.price;
					b2bPaxLabel = tier.name;
				}
			}

			const formatIsoWithOffset = (date: Date) => {
				const tzOffset = -date.getTimezoneOffset();
				const diff = tzOffset >= 0 ? "+" : "-";
				const pad = (num: number) => {
					const norm = Math.floor(Math.abs(num));
					return (norm < 10 ? "0" : "") + norm;
				};
				return (
					date.getFullYear() +
					"-" +
					pad(date.getMonth() + 1) +
					"-" +
					pad(date.getDate()) +
					"T" +
					pad(date.getHours()) +
					":" +
					pad(date.getMinutes()) +
					":" +
					pad(date.getSeconds()) +
					diff +
					pad(tzOffset / 60) +
					":" +
					pad(tzOffset % 60)
				);
			};

			const payload: ScheduleEventInput = {
				title: data.title,
				dateStr: data.dateStr,
				startTimeStr: data.startTimeStr,
				endTimeStr: data.endTimeStr,
				isoStart: formatIsoWithOffset(startDateTime),
				isoEnd: formatIsoWithOffset(endDateTime),
				weekday,
				type: data.type,
				outdoorPrice: parsePrice,
				b2bPrice,
				b2bPaxLabel,
			};

			startTransition(() => {
				formAction(payload);
			});
		} catch (error) {
			console.error(error);
			toast.error("An unexpected error occurred.");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-card sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Nouveau Session</DialogTitle>
					<DialogDescription>
						Schedule a new class or private session. Validates against studio
						hours and calendar availability.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
					<div className="space-y-2">
						<Label>Title</Label>
						<Controller
							control={control}
							name="title"
							render={({ field }) => (
								<Input placeholder="Vinyasa Flow..." {...field} />
							)}
						/>
						{errors.title ? (
							<p className="text-sm text-red-500">{errors.title.message}</p>
						) : null}
					</div>

					<div className="space-y-2">
						<Label>Type</Label>
						<Controller
							control={control}
							name="type"
							render={({ field }) => (
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select type" />
									</SelectTrigger>
									<SelectContent className="w-full">
										<SelectItem value="group">Group Class</SelectItem>
										<SelectItem value="private">Private Session</SelectItem>
										<SelectItem value="b2b">B2B Event</SelectItem>
										<SelectItem value="outdoor">Outdoor Session</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
					</div>

					{selectedType === "outdoor" ? (
						<div className="space-y-2">
							<Label>Price per person (MAD)</Label>
							<Controller
								control={control}
								name="outdoorPrice"
								render={({ field }) => (
									<Input type="number" placeholder="150" {...field} />
								)}
							/>
							{errors.outdoorPrice ? (
								<p className="text-sm text-red-500">
									{errors.outdoorPrice.message}
								</p>
							) : null}
						</div>
					) : null}

					{selectedType === "b2b" ? (
						<div className="space-y-2">
							<Label>Pricing Tier</Label>
							<Controller
								control={control}
								name="b2bTierId"
								render={({ field }) => (
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select tier" />
										</SelectTrigger>
										<SelectContent className="w-full">
											{tiers
												.filter((t) => !t.isArchived)
												.map((tier) => (
													<SelectItem key={tier.id} value={tier.id}>
														{tier.name} ({tier.price} MAD)
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								)}
							/>
							{errors.b2bTierId ? (
								<p className="text-sm text-red-500">
									{errors.b2bTierId.message}
								</p>
							) : null}
						</div>
					) : null}

					<div className="space-y-2">
						<Label>Date</Label>
						<Controller
							control={control}
							name="dateStr"
							render={({ field }) => <Input type="date" {...field} />}
						/>
						{errors.dateStr ? (
							<p className="text-sm text-red-500">{errors.dateStr.message}</p>
						) : null}
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Start Time</Label>
							<Controller
								control={control}
								name="startTimeStr"
								render={({ field }) => <Input type="time" {...field} />}
							/>
							{errors.startTimeStr ? (
								<p className="text-sm text-red-500">
									{errors.startTimeStr.message}
								</p>
							) : null}
						</div>
						<div className="space-y-2">
							<Label>End Time</Label>
							<Controller
								control={control}
								name="endTimeStr"
								render={({ field }) => <Input type="time" {...field} />}
							/>
							{errors.endTimeStr ? (
								<p className="text-sm text-red-500">
									{errors.endTimeStr.message}
								</p>
							) : null}
						</div>
					</div>

					<div className="flex justify-end space-x-2 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? (
								<Refresh className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							Schedule
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
