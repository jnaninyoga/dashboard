"use client";

import { useState } from "react";

import { EventCard } from "@/components/schedule/events/card";
import { NewSessionDialog } from "@/components/schedule/sessions/new-dialog";
import { Button } from "@/components/ui/button";
import { CalendarEvent, GroupedEvents } from "@/lib/types";

import { format, parseISO } from "date-fns";
import { Add } from "iconsax-reactjs";

export function ScheduleClient({ initialEvents }: { initialEvents: CalendarEvent[] }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Group events by day
    const groupedEvents = initialEvents.reduce((acc, event) => {
        const startIso = event.start?.dateTime;
        if (!startIso) return acc;
        
        const dateKey = format(parseISO(startIso), "yyyy-MM-dd");
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(event);
        return acc;
    }, {} as GroupedEvents);

    // Sort dates
    const sortedDates = Object.keys(groupedEvents).sort();

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
                sortedDates.map((dateKey) => (
                    <div key={dateKey} className="space-y-4">
                        <h3 className="border-b pb-2 text-lg font-semibold">
                            {format(parseISO(dateKey), "EEEE, MMMM do")}
                        </h3>
                        <div className="flex flex-col gap-3">
                            {groupedEvents[dateKey].map((event) => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    </div>
                ))
            )}

            <NewSessionDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </div>
    );
}
