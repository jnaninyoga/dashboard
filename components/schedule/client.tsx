"use client";

import { useMemo, useState } from "react";

import { EventCard } from "@/components/schedule/events/card";
import { NewSessionDialog } from "@/components/schedule/sessions/new-dialog";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { CalendarEvent, GroupedEvents } from "@/lib/types";
import { cn } from "@/lib/utils/ui";

import { format, isToday as isTodayDate, parseISO } from "date-fns";
import { Add } from "iconsax-reactjs";

export function ScheduleClient({ initialEvents }: { initialEvents: CalendarEvent[] }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { groupedEvents, sortedDates, todayKey } = useMemo(() => {
        const grouped = initialEvents.reduce((acc, event) => {
            const startIso = event.start?.dateTime;
            if (!startIso) return acc;
            const dateKey = format(parseISO(startIso), "yyyy-MM-dd");
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(event);
            return acc;
        }, {} as GroupedEvents);

        return {
            groupedEvents: grouped,
            sortedDates: Object.keys(grouped).sort(),
            todayKey: format(new Date(), "yyyy-MM-dd"),
        };
    }, [initialEvents]);

    // Controlled so the accordion opens today by default AND re-opens it whenever
    // today appears in the list after a navigation/refresh.
    const defaultOpen = useMemo(() => {
        if (sortedDates.includes(todayKey)) return todayKey;
        // Fall back to the first upcoming day so the operator always lands on
        // something expanded rather than a wall of collapsed rows.
        const firstFuture = sortedDates.find((d) => d >= todayKey);
        return firstFuture ?? sortedDates[0] ?? "";
    }, [sortedDates, todayKey]);

    const [openDate, setOpenDate] = useState<string>(defaultOpen);

    return (
        <div className="space-y-8">
            <div className="mb-4 flex justify-end">
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Add className="mr-2 h-4 w-4" variant="Outline" />
                    Nouveau Session
                </Button>
            </div>

            {sortedDates.length === 0 ? (
                <div className="bg-muted/30 rounded-lg border border-dashed p-8 text-center">
                    <p className="text-muted-foreground">No upcoming sessions scheduled for this week.</p>
                </div>
            ) : (
                <Accordion
                    type="single"
                    collapsible
                    value={openDate}
                    onValueChange={setOpenDate}
                    className="flex flex-col gap-3"
                >
                    {sortedDates.map((dateKey) => {
                        const count = groupedEvents[dateKey].length;
                        const parsed = parseISO(dateKey);
                        const isToday = isTodayDate(parsed);
                        return (
                            <AccordionItem
                                key={dateKey}
                                value={dateKey}
                                className="bg-card zen-shadow rounded-2xl px-5 py-1"
                            >
                                <AccordionTrigger className="py-4 no-underline hover:no-underline">
                                    <div className="flex flex-1 items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <h3
                                                className={cn(
                                                    "text-foreground font-heading text-lg font-semibold md:text-xl",
                                                    isToday && "text-primary",
                                                )}
                                            >
                                                {format(parsed, "EEEE, MMMM do")}
                                            </h3>
                                            {isToday ? (
                                                <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                                                    Today
                                                </span>
                                            ) : null}
                                        </div>
                                        <span className="text-muted-foreground bg-muted/60 rounded-full px-3 py-1 text-xs font-semibold tracking-wide tabular-nums">
                                            {count} {count === 1 ? "session" : "sessions"}
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col gap-3 pt-2 pb-4">
                                    {groupedEvents[dateKey].map((event) => (
                                        <EventCard key={event.id} event={event} />
                                    ))}
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            )}

            <NewSessionDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </div>
    );
}
