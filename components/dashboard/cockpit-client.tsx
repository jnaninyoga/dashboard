"use client";

import { useState } from "react";

import { EventCard } from "@/components/dashboard/event-card";
import { NewSessionDialog } from "@/components/dashboard/new-session-dialog";
import { Button } from "@/components/ui/button";
import { type CalendarEvent } from "@/lib/types/calendar";

import { Add } from "iconsax-reactjs";

export function CockpitClient({ initialEvents, initialError }: { initialEvents: CalendarEvent[], initialError: string | null }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <div className="flex flex-col gap-5">
            <div className="bg-card zen-shadow flex items-center justify-between rounded-3xl p-5">
                <div className="flex flex-col gap-0.5">
                    <h2 className="font-heading text-foreground text-lg font-semibold tracking-tight">Today&apos;s Agenda</h2>
                    <span className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">{initialEvents.length} Sessions</span>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="zen-glow-teal min-h-[48px] rounded-full px-6 font-semibold" variant="default">
                    <Add className="h-5 w-5 text-white" variant="Outline" />
                    New Session
                </Button>
            </div>

            {initialError ? (
                <div className="zen-shadow rounded-2xl bg-red-50 p-5 font-medium text-red-700">
                    {initialError}
                </div>
            ) : null}

            <div className="flex flex-col gap-3">
                {initialEvents.length === 0 && !initialError ? (
                    <div className="bg-card zen-shadow rounded-3xl p-12 text-center">
                        <p className="text-muted-foreground text-base font-medium">The studio is quiet today.</p>
                        <p className="text-muted-foreground mt-2 text-xs">Enjoy the peaceful downtime, or add a private session.</p>
                    </div>
                ) : (
                    initialEvents.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))
                )}
            </div>

            <NewSessionDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </div>
    );
}
