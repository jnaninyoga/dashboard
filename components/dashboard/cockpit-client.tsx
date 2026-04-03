"use client";

import { useState } from "react";
import { Add } from "iconsax-reactjs";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/dashboard/event-card";
import { NewSessionDialog } from "@/components/dashboard/new-session-dialog";

export function CockpitClient({ initialEvents, initialError }: { initialEvents: any[], initialError: string | null }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center bg-card zen-shadow p-5 rounded-3xl">
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-lg font-heading font-semibold text-foreground tracking-tight">Today&apos;s Agenda</h2>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">{initialEvents.length} Sessions</span>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="rounded-full zen-glow-teal min-h-[48px] px-6 font-semibold" variant="default">
                    <Add className="h-5 w-5 text-white" variant="Outline" />
                    New Session
                </Button>
            </div>

            {initialError && (
                <div className="p-5 bg-red-50 text-red-700 rounded-2xl zen-shadow font-medium">
                    {initialError}
                </div>
            )}

            <div className="flex flex-col gap-3">
                {initialEvents.length === 0 && !initialError ? (
                    <div className="p-12 text-center bg-card rounded-3xl zen-shadow">
                        <p className="text-muted-foreground font-medium text-base">The studio is quiet today.</p>
                        <p className="text-xs text-muted-foreground mt-2">Enjoy the peaceful downtime, or add a private session.</p>
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
