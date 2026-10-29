import { ScheduleClient } from "@/components/schedule/client";
import { CalendarEvent } from "@/lib/types";
import { getUpcomingEvents, withGoogle } from "@/services/google";
import { createClient } from "@/services/supabase/server";

export default async function SchedulePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let events: CalendarEvent[] = [];
    let errorMsg: string | null = null;

    if (user) {
        const week = await withGoogle(user.id, "Google Calendar", (token) => getUpcomingEvents(token, 7));
        events = week.data ?? [];
        errorMsg = week.error ?? null;
    }

    return (
        <>
            <header className="flex flex-col space-y-1">
                <h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">Weekly Schedule</h1>
                <p className="text-md text-muted-foreground">View all upcoming sessions and classes for the week ahead.</p>
            </header>
            
            {errorMsg ? (
                <div className="border-destructive/25 bg-destructive/10 text-destructive rounded-md border p-4">
                    {errorMsg}
                </div>
            ) : (
                <ScheduleClient initialEvents={events} />
            )}
        </>
    );
}
