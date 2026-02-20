"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parse } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { scheduleNewEventAction, ScheduleEventInput } from "@/actions/schedule";
import { Loader2 } from "lucide-react";

const sessionSchema = z.object({
    title: z.string().min(1, "Title is required"),
    dateStr: z.string().min(1, "Date is required"),
    startTimeStr: z.string().min(1, "Start time is required"),
    endTimeStr: z.string().min(1, "End time is required"),
    type: z.enum(["group", "private", "outdoor", "b2b"]),
    outdoorPrice: z.string().optional()
}).refine(data => {
    return data.startTimeStr < data.endTimeStr;
}, {
    message: "End time must be after start time",
    path: ["endTimeStr"]
}).refine(data => {
    if (data.type === "outdoor" && (!data.outdoorPrice || isNaN(Number(data.outdoorPrice)))) {
        return false;
    }
    return true;
}, {
    message: "Valid price is required for outdoor sessions",
    path: ["outdoorPrice"]
});

type SessionFormValues = z.infer<typeof sessionSchema>;

export function NewSessionDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<SessionFormValues>({
        resolver: zodResolver(sessionSchema),
        defaultValues: {
            title: "",
            dateStr: format(new Date(), "yyyy-MM-dd"),
            startTimeStr: "08:00",
            endTimeStr: "09:00",
            type: "group",
            outdoorPrice: "",
        }
    });

    const selectedType = watch("type");

    const onSubmit = async (data: SessionFormValues) => {
        setIsSubmitting(true);
        try {
            // Reconstruct ISO strings with current local timezone offset
            // We use javascript Date to combine them and get the local timezone offset automatically.
            const startDateTime = parse(`${data.dateStr} ${data.startTimeStr}`, "yyyy-MM-dd HH:mm", new Date());
            const endDateTime = parse(`${data.dateStr} ${data.endTimeStr}`, "yyyy-MM-dd HH:mm", new Date());

            // Get local weekday (0-6)
            const weekday = startDateTime.getDay();

            const parsePrice = data.type === "outdoor" && data.outdoorPrice ? Number(data.outdoorPrice) : null;

            const payload: ScheduleEventInput = {
                title: data.title,
                dateStr: data.dateStr,
                startTimeStr: data.startTimeStr,
                endTimeStr: data.endTimeStr,
                isoStart: startDateTime.toISOString(), // Because startDateTime was parsed in local timezone, .toISOString() converts it to UTC which is what Google wants with offsets/Z natively.
                isoEnd: endDateTime.toISOString(),
                weekday,
                type: data.type,
                outdoorPrice: parsePrice
            };

            // Wait, Google Calendar accepts general ISO string like "2024-10-25T08:00:00+01:00".
            // .toISOString() produces "2024-10-25T07:00:00.000Z" which is perfectly standard and timezone aware.
            // Google handles 'Z' just fine. Let's ensure the local time string conversion includes proper offset padding if needed by creating a specific format.
            // Actually, Z is preferred by Google Calendar representing UTC time.

            // The exact requirement from user: "Google Calendar API expects proper ISO strings with offsets (e.g., 2024-10-25T08:00:00+01:00)."
            // Let's format it manually to preserve local time with offset.
            
            const formatIsoWithOffset = (date: Date) => {
                const tzOffset = -date.getTimezoneOffset();
                const diff = tzOffset >= 0 ? '+' : '-';
                const pad = (num: number) => {
                    const norm = Math.floor(Math.abs(num));
                    return (norm < 10 ? '0' : '') + norm;
                };
                return date.getFullYear() +
                    '-' + pad(date.getMonth() + 1) +
                    '-' + pad(date.getDate()) +
                    'T' + pad(date.getHours()) +
                    ':' + pad(date.getMinutes()) +
                    ':' + pad(date.getSeconds()) +
                    diff + pad(tzOffset / 60) +
                    ':' + pad(tzOffset % 60);
            };

            payload.isoStart = formatIsoWithOffset(startDateTime);
            payload.isoEnd = formatIsoWithOffset(endDateTime);

            const result = await scheduleNewEventAction(payload);
            
            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Session scheduled successfully!");
            reset();
            onOpenChange(false);
            router.refresh(); // Refresh the page to load new events
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nouveau Session</DialogTitle>
                    <DialogDescription>
                        Schedule a new class or private session. Validates against studio hours and calendar availability.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Controller
                            control={control}
                            name="title"
                            render={({ field }) => <Input placeholder="Vinyasa Flow..." {...field} />}
                        />
                        {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Controller
                            control={control}
                            name="type"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="group">Group Class</SelectItem>
                                        <SelectItem value="private">Private Session</SelectItem>
                                        <SelectItem value="b2b">B2B Event</SelectItem>
                                        <SelectItem value="outdoor">Outdoor Session</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    {selectedType === "outdoor" && (
                        <div className="space-y-2">
                            <Label>Price per person (MAD)</Label>
                            <Controller
                                control={control}
                                name="outdoorPrice"
                                render={({ field }) => <Input type="number" placeholder="150" {...field} />}
                            />
                            {errors.outdoorPrice && <p className="text-sm text-red-500">{errors.outdoorPrice.message}</p>}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Controller
                            control={control}
                            name="dateStr"
                            render={({ field }) => <Input type="date" {...field} />}
                        />
                        {errors.dateStr && <p className="text-sm text-red-500">{errors.dateStr.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Time</Label>
                            <Controller
                                control={control}
                                name="startTimeStr"
                                render={({ field }) => <Input type="time" {...field} />}
                            />
                            {errors.startTimeStr && <p className="text-sm text-red-500">{errors.startTimeStr.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>End Time</Label>
                            <Controller
                                control={control}
                                name="endTimeStr"
                                render={({ field }) => <Input type="time" {...field} />}
                            />
                            {errors.endTimeStr && <p className="text-sm text-red-500">{errors.endTimeStr.message}</p>}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Schedule
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
