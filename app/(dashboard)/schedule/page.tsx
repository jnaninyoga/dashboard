import { ScheduleClient } from "@/components/schedule/client";
import { CalendarEvent } from "@/lib/types";
import { getUpcomingEvents } from "@/services/google";
import { getValidAccessToken } from "@/services/google";
import { createClient } from "@/services/supabase/server";

export default async function SchedulePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let events: CalendarEvent[] = [];
    let errorMsg: string | null = null;

    if (user) {
        try {
            const token = await getValidAccessToken(user.id);
            events = await getUpcomingEvents(token, 7); // Fetch next 7 days
        } catch {
            errorMsg = "Please reconnect Google Calendar to view the schedule.";
        }
    }

    return (
        <>
            <header className="flex flex-col space-y-1">
                <h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">Weekly Schedule</h1>
                <p className="text-md text-muted-foreground">View all upcoming sessions and classes for the week ahead.</p>
            </header>
            
            {errorMsg ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
                    {errorMsg}
                </div>
            ) : (
                <ScheduleClient initialEvents={events} />
            )}
        </>
    );
}
