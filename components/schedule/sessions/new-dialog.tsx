"use client";

import { startTransition, useActionState, useEffect, useId, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";

import { FormSheet } from "@/components/form-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { scheduleNewEventAction } from "@/lib/actions/schedule/events";
import { getB2BPricingTiers } from "@/lib/actions/settings";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { type B2BTier, type ScheduleEventInput } from "@/lib/types";
import { normalizeDecimalInput } from "@/lib/utils/currency";
import { type SessionFormValues,sessionSchema } from "@/lib/validators";

import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse } from "date-fns";
import { CalendarAdd, Refresh } from "iconsax-reactjs";

const todayStr = () => format(new Date(), "yyyy-MM-dd");
const currentHourStr = () => format(new Date(), "HH:00");

const freshSession = (): SessionFormValues => ({
	title: "",
	dateStr: todayStr(),
	startTimeStr: "08:00",
	endTimeStr: "09:00",
	type: "group",
	outdoorPrice: "",
	b2bTierId: "",
});

export function NewSessionDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const formId = useId();
	const [tiers, setTiers] = useState<B2BTier[]>([]);
	const router = useRouter();

	const [state, formAction, isPending] = useActionState(
		async (_: unknown, payload: ScheduleEventInput) => {
			return await scheduleNewEventAction(payload);
		},
		null,
	);

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm<SessionFormValues>({
		resolver: zodResolver(sessionSchema),
		defaultValues: freshSession(),
	});

	// Each open starts a fresh session (today's date, not a discarded draft).
	useEffect(() => {
		if (!open) return;
		reset(freshSession());
		getB2BPricingTiers()
			.then(setTiers)
			.catch((error) => notify.error("Couldn't load the B2B tiers", { error }));
	}, [open, reset]);

	useEffect(() => {
		if (state?.success) {
			notify.success("Session scheduled");
			onOpenChange(false);
			router.refresh();
		} else if (state?.error) {
			notifyActionError(state, "Something went wrong");
		}
	}, [state, reset, onOpenChange, router]);

	const selectedType = useWatch({ control, name: "type" });
	const selectedDate = useWatch({ control, name: "dateStr" });
	const isToday = selectedDate === todayStr();

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
			notify.error("Couldn't schedule this session", { error });
		}
	};

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			busy={isPending}
			dirty={isDirty}
			icon={<CalendarAdd size={28} variant="Bulk" />}
			title="New session"
			description="Checked against your Google Calendar (and studio hours for classes) before it's added."
			footer={
				<Button type="submit" form={formId} disabled={isPending} className="h-11 rounded-xl">
					{isPending ? <Refresh className="mr-2 h-4 w-4 animate-spin" /> : null}
					Schedule
				</Button>
			}
		>
				<form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
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
									value={field.value}
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
									<Input 
										inputMode="decimal"
										placeholder="150" 
										{...field} 
										value={field.value ?? ""}
										onChange={(e) => {
											const val = normalizeDecimalInput(e.target.value);
											const parts = val.split(".");
											const sanitized = parts[0] + (parts.length > 1 ? "." + parts.slice(1).join("") : "");
											field.onChange(sanitized);
										}}
									/>
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
										value={field.value}
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
							render={({ field }) => (
								<Input type="date" min={todayStr()} {...field} />
							)}
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
								render={({ field }) => (
									<Input
										type="time"
										min={isToday ? currentHourStr() : undefined}
										{...field}
									/>
								)}
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

				</form>
		</FormSheet>
	);
}
