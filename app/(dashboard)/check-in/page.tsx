import { createClient } from "@/supabase/server";
import { getValidAccessToken } from "@/services/google-tokens";
import { getTodayEvents } from "@/services/google-calendar";
import { CockpitClient } from "@/components/dashboard/cockpit-client";
import { redirect } from "next/navigation";

export default async function CheckInIndexPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    let events: any[] = [];
    let errorMsg = null;

    try {
        const token = await getValidAccessToken(user.id);
        events = await getTodayEvents(token);
    } catch (e) {
        errorMsg = "Please reconnect Google Calendar to view today's schedule.";
    }

    return (
        <>
            <header className="flex flex-col space-y-1">
                <h1 className="text-3xl md:text-4xl font-heading font-medium tracking-tight text-foreground">Check-in Portal</h1>
                <p className="text-md text-muted-foreground">Select a session from today&apos;s schedule to manage client attendance.</p>
            </header>
            
            <CockpitClient initialEvents={events} initialError={errorMsg} />
        </>
    );
}
