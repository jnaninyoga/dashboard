"use client";

import { useState } from "react";
import { EventCard } from "@/components/dashboard/event-card";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Add } from "iconsax-reactjs";
import { NewSessionDialog } from "@/components/dashboard/new-session-dialog";

export function ScheduleClient({ initialEvents }: { initialEvents: any[] }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Group events by day
    // @ts-expect-error - dynamic event grouping
    const groupedEvents = initialEvents.reduce((acc, event) => {
        const startIso = event.start?.dateTime;
        if (!startIso) return acc;
        
        const dateKey = format(parseISO(startIso), "yyyy-MM-dd");
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(event);
        return acc;
    }, {} as Record<string, any[]>);

    // Sort dates
    const sortedDates = Object.keys(groupedEvents).sort();

    return (
        <div className="space-y-8">
            <div className="flex justify-end mb-4">
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Add className="mr-2 h-4 w-4" variant="Outline" />
                    Nouveau Session
                </Button>
            </div>

            {sortedDates.length === 0 ? (
                <div className="p-8 text-center bg-muted/30 rounded-lg border border-dashed">
                    <p className="text-muted-foreground">No upcoming sessions scheduled for this week.</p>
                </div>
            ) : (
                sortedDates.map((dateKey) => (
                    <div key={dateKey} className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">
                            {format(parseISO(dateKey), "EEEE, MMMM do")}
                        </h3>
                        <div className="flex flex-col gap-3">
                            {groupedEvents[dateKey].map((event: any) => (
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
