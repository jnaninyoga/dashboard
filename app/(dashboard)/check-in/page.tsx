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
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Check-in Portal</h1>
                <p className="text-muted-foreground">Select a session from today's schedule to manage client attendance.</p>
            </header>
            
            <CockpitClient initialEvents={events} initialError={errorMsg} />
        </div>
    );
}
