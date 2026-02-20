"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/dashboard/event-card";
import { NewSessionDialog } from "@/components/dashboard/new-session-dialog";

export function CockpitClient({ initialEvents, initialError }: { initialEvents: any[], initialError: string | null }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Today's Schedule</h2>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau Session
                </Button>
            </div>

            {initialError && (
                <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
                    {initialError}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {initialEvents.length === 0 && !initialError ? (
                    <div className="col-span-full p-8 text-center bg-muted/30 rounded-lg border border-dashed">
                        <p className="text-muted-foreground">No sessions scheduled for today. Have a relaxing day!</p>
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
