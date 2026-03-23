import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { ShieldAlert, Users, Calendar as CalendarIcon, MapPin, ArrowLeft } from "lucide-react";
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
        <div className="flex flex-col min-h-screen bg-stone-50 md:bg-stone-100 pb-20 font-sans">
            {/* Rich Header with Dynamic Gradient based on Session Type */}
            <header className={`relative text-white px-6 py-12 md:py-16 shadow-lg overflow-hidden ${
                type === 'group' ? 'bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500' :
                type === 'private' ? 'bg-gradient-to-br from-orange-600 via-rose-500 to-pink-600' :
                type === 'outdoor' ? 'bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-600' :
                'bg-gradient-to-br from-slate-800 to-slate-600'
            }`}>
                {/* Decorative Subtle Overlay */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
                
                <div className="relative z-10 max-w-4xl mx-auto flex flex-col gap-5">
                    <div className="flex justify-between items-center text-sm md:text-base mb-1">
                        <Link href="/" className="group flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all rounded-full p-2 md:px-4 shadow-sm border border-white/20">
                            <ArrowLeft className="w-5 h-5 md:mr-2 transition-transform group-hover:-translate-x-1" />
                            <span className="hidden md:inline font-medium">Back to Schedule</span>
                        </Link>
                        <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm border border-white/30 backdrop-blur-xl bg-white/20">
                            {type} Session
                        </span>
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-md text-white">
                        {title}
                    </h1>
                    
                    <div className="flex items-center gap-2 text-white/90 font-medium text-lg mt-1 drop-shadow-sm">
                        <CalendarIcon className="w-5 h-5 flex-shrink-0" />
                        {startTime ? format(new Date(startTime), "EEEE, MMMM d, yyyy 'at' h:mm a") : "Time TBA"}
                    </div>
                </div>
            </header>

            {/* Main Content Area pulled up to overlap header */}
            <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6 -mt-8 relative z-20">
                <CheckInManager 
                    eventId={eventId} 
                    eventType={type} 
                    initialAttendance={attendanceRecords} 
                />
            </main>
        </div>
    );
}
