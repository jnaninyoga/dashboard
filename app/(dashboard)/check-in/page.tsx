import { CockpitClient } from "@/components/dashboard/cockpit/client";
import { getSessionFeed } from "@/lib/actions/schedule/feed";
import { studioDateString } from "@/lib/utils/time";

export default async function CheckInIndexPage() {
    const today = studioDateString();
    const feed = await getSessionFeed(today, today);
    // Check-in only applies to in-studio sessions (group, private). Off-site
    // b2b/outdoor events are managed in Google Calendar and have no check-in
    // workflow, so we filter them out of the portal to avoid confusion.
    // Events made outside the dashboard aren't classes to check into either.
    const sessions = (feed.data ?? []).filter((s) => !s.external && (s.type === "group" || s.type === "private"));

    return (
        <>
            <header className="flex flex-col space-y-1">
                <h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">Check-in</h1>
                <p className="text-muted-foreground">Today&apos;s classes and private sessions. Open one to check clients in.</p>
            </header>

            <CockpitClient sessions={sessions} error={feed.error ?? null} bare />
        </>
    );
}
