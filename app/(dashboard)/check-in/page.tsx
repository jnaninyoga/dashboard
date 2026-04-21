import { redirect } from "next/navigation";

import { CockpitClient } from "@/components/dashboard/cockpit/client";
import { CalendarEvent } from "@/lib/types";
import { getTodayEvents } from "@/services/google";
import { getValidAccessToken } from "@/services/google";
import { createClient } from "@/services/supabase/server";

export default async function CheckInIndexPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    let events: CalendarEvent[] = [];
    let errorMsg: string | null = null;

    try {
        const token = await getValidAccessToken(user.id);
        events = await getTodayEvents(token);
    } catch {
        errorMsg = "Please reconnect Google Calendar to view today's schedule.";
    }

    return (
        <>
            <header className="flex flex-col space-y-1">
                <h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">Check-in Portal</h1>
                <p className="text-md text-muted-foreground">Select a session from today&apos;s schedule to manage client attendance.</p>
            </header>
            
            <CockpitClient initialEvents={events} initialError={errorMsg} />
        </>
    );
}
