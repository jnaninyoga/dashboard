import { CockpitClient } from "@/components/dashboard/cockpit-client";
import { CalendarEvent } from "@/lib/types";
import { getTodayEvents } from "@/services/google-calendar";
import { getValidAccessToken } from "@/services/google-tokens";
import { createClient } from "@/supabase/server";

import { format } from "date-fns";

export default async function Home() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let events: CalendarEvent[] = [];
    let errorMsg: string | null = null;

    if (user) {
        try {
            const token = await getValidAccessToken(user.id);
            events = await getTodayEvents(token);
        } catch {
            errorMsg = "Please reconnect Google Calendar to view today's schedule.";
        }
    }

    const todayStr = format(new Date(), "EEEE, MMMM do, yyyy");

    return (
        <main className="flex flex-1 flex-col gap-6 p-6">
            <header className="flex flex-col items-start justify-between space-y-2 sm:flex-row sm:items-center sm:space-y-0">
                <div className="block space-y-1">
                    <h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">
                        Bonjour, Ourda
                    </h1>
                    <p className="text-md text-muted-foreground">{todayStr}</p>
                </div>
            </header>
            
            <CockpitClient initialEvents={events} initialError={errorMsg} />
        </main>
    );
}
