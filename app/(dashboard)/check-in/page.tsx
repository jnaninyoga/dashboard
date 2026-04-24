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
        const todayEvents = await getTodayEvents(token);
        // Check-in only applies to in-studio sessions (group, private). Off-site
        // b2b/outdoor events are managed in Google Calendar and have no check-in
        // workflow, so we filter them out of the portal to avoid confusion.
        events = todayEvents.filter((e) => {
            const type = e.extendedProperties?.private?.jnaninEventType;
            return type === "group" || type === "private";
        });
    } catch {
        errorMsg = "Please reconnect Google Calendar to view today's schedule.";
    }

    return (
        <>
            <header className="flex flex-col space-y-1">
                <h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">Check-in Portal</h1>
                <p className="text-md text-muted-foreground">Select a group or private studio session from today to manage client attendance.</p>
            </header>

            <CockpitClient initialEvents={events} initialError={errorMsg} />
        </>
    );
}
