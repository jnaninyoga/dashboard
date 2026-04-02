import { createClient } from "@/supabase/server";
import { getValidAccessToken } from "@/services/google-tokens";
import { getUpcomingEvents } from "@/services/google-calendar";
import { ScheduleClient } from "./schedule-client";

export default async function SchedulePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let events: any[] = [];
    let errorMsg = null;

    if (user) {
        try {
            const token = await getValidAccessToken(user.id);
            events = await getUpcomingEvents(token, 7); // Fetch next 7 days
        } catch (e) {
            errorMsg = "Please reconnect Google Calendar to view the schedule.";
        }
    }

    return (
        <>
            <header className="flex flex-col space-y-1">
                <h1 className="text-3xl md:text-4xl font-heading font-medium tracking-tight text-foreground">Weekly Schedule</h1>
                <p className="text-md text-muted-foreground">View all upcoming sessions and classes for the week ahead.</p>
            </header>
            
            {errorMsg ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
                    {errorMsg}
                </div>
            ) : (
                <ScheduleClient initialEvents={events} />
            )}
        </>
    );
}
