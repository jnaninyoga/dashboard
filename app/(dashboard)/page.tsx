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
        <main className="flex flex-1 flex-col gap-6 p-6">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <div className="space-y-1 block">
                    <h1 className="text-3xl md:text-4xl font-heading font-medium tracking-tight text-foreground">
                        Bonjour, Ourda
                    </h1>
                    <p className="text-md text-muted-foreground">{todayStr}</p>
                </div>
            </header>
            
            <CockpitClient initialEvents={events} initialError={errorMsg} />
        </main>
    );
}
