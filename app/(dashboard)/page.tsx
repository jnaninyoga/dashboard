import { createClient } from "@/supabase/server";
import { getValidAccessToken } from "@/services/google-tokens";
import { getTodayEvents } from "@/services/google-calendar";
import { format } from "date-fns";
import { CockpitClient } from "@/components/dashboard/cockpit-client";

export default async function Home() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let events: any[] = [];
    let errorMsg = null;

    if (user) {
        try {
            const token = await getValidAccessToken(user.id);
            events = await getTodayEvents(token);
        } catch (e) {
            errorMsg = "Please reconnect Google Calendar to view today's schedule.";
        }
    }

    const todayStr = format(new Date(), "EEEE, MMMM do, yyyy");

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bonjour, Ourda 👋</h1>
                    <p className="text-muted-foreground">{todayStr}</p>
                </div>
            </header>
            
            <CockpitClient initialEvents={events} initialError={errorMsg} />
        </div>
    );
}
