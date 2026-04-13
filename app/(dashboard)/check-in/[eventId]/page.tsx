import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getEventAttendanceAction } from "@/actions/schedule/attendance";
import { CheckInManager } from "@/components/schedule/check-in";
import { getEventById, type JnaninEventType } from "@/services/google-calendar";
import { getValidAccessToken } from "@/services/google-tokens";
import { createClient } from "@/supabase/server";

import { format } from "date-fns";
import { ArrowLeft2,Calendar as CalendarIcon } from "iconsax-reactjs";

interface PageProps {
    params: Promise<{ eventId: string }>;
}

export default async function CheckInPage({ params }: PageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { eventId } = await params;

    let accessToken: string;
    let eventDetails: unknown = null;
    
    try {
        accessToken = await getValidAccessToken(user.id);
        eventDetails = await getEventById(accessToken, eventId);
    } catch (error) {
        console.error("Failed to fetch event:", error);
        notFound();
    }

    if (!eventDetails) {
        notFound();
    }

    const details = eventDetails as { 
        summary?: string; 
        start?: { dateTime?: string; date?: string };
        extendedProperties?: { private?: { jnaninEventType?: string } };
    };

    const title = details.summary || "Unnamed Event";
    const startTime = details.start?.dateTime || details.start?.date;
    const type = (details.extendedProperties?.private?.jnaninEventType as JnaninEventType) || "group";
    
    // Fetch currently checked-in clients
    const attendanceRecords = await getEventAttendanceAction(eventId);

    return (
        <div className="bg-background flex min-h-screen flex-col pb-24 font-sans">
            {/* Zen Header — soft, borderless, with warm surface */}
            <header className="bg-primary/70 zen-shadow relative z-10 rounded-b-3xl px-6 py-8 md:py-10">
                <div className="mx-auto flex max-w-4xl flex-col gap-4">
                    <div className="mb-1 flex items-center justify-between text-sm md:text-base">
                        <Link href="/check-in" className="group text-primary-foreground flex min-h-[48px] items-center font-semibold transition-colors hover:text-white">
                            <ArrowLeft2 className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
                            <span>Back to Schedule</span>
                        </Link>
                        <span className="bg-secondary text-secondary-foreground rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase">
                            {type} Session
                        </span>
                    </div>
                    
                    <h1 className="font-vibes text-primary-foreground text-5xl tracking-tight capitalize md:text-7xl">
                        {title}
                    </h1>
                    
                    <div className="text-primary-foreground mt-1 flex items-center gap-2 text-base font-medium">
                        <CalendarIcon className="h-5 w-5 shrink-0" variant="Outline" />
                        {startTime ? format(new Date(startTime), "EEEE, MMMM d, yyyy 'at' h:mm a") : "Time TBA"}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="relative z-20 mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-5 py-6 md:px-6">
                <CheckInManager 
                    eventId={eventId} 
                    eventType={type} 
                    initialAttendance={attendanceRecords} 
                />
            </main>
        </div>
    );
}
