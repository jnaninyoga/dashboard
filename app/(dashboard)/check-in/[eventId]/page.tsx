import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ArrowLeft2 } from "iconsax-reactjs";
import Link from "next/link";
import { getEventById, type JnaninEventType } from "@/services/google-calendar";
import { getEventAttendanceAction } from "@/actions/attendance";
import { createClient } from "@/supabase/server";
import { getValidAccessToken } from "@/services/google-tokens";
import { CheckInManager } from "@/components/check-in/check-in-manager";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let eventDetails: any = null;
    
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

    const title = eventDetails.summary || "Unnamed Event";
    const startTime = eventDetails.start?.dateTime || eventDetails.start?.date;
    const type = (eventDetails.extendedProperties?.private?.jnaninEventType as JnaninEventType) || "group";
    
    // Fetch currently checked-in clients
    const attendanceRecords = await getEventAttendanceAction(eventId);

    return (
        <div className="flex flex-col min-h-screen bg-background pb-24 font-sans">
            {/* Zen Header — soft, borderless, with warm surface */}
            <header className="bg-primary/70 zen-shadow px-6 py-8 md:py-10 z-10 relative rounded-b-3xl">
                <div className="max-w-4xl mx-auto flex flex-col gap-4">
                    <div className="flex justify-between items-center text-sm md:text-base mb-1">
                        <Link href="/check-in" className="group flex items-center text-primary-foreground hover:text-white transition-colors font-semibold min-h-[48px]">
                            <ArrowLeft2 className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
                            <span>Back to Schedule</span>
                        </Link>
                        <span className="px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-widest">
                            {type} Session
                        </span>
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl capitalize font-vibes tracking-tight text-primary-foreground">
                        {title}
                    </h1>
                    
                    <div className="flex items-center gap-2 text-primary-foreground font-medium text-base mt-1">
                        <CalendarIcon className="w-5 h-5 shrink-0" variant="Outline" />
                        {startTime ? format(new Date(startTime), "EEEE, MMMM d, yyyy 'at' h:mm a") : "Time TBA"}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-4xl w-full mx-auto px-5 md:px-6 py-6 flex flex-col gap-6 relative z-20">
                <CheckInManager 
                    eventId={eventId} 
                    eventType={type} 
                    initialAttendance={attendanceRecords} 
                />
            </main>
        </div>
    );
}
