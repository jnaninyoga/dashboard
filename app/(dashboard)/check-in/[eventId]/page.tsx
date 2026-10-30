import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CheckInManager } from "@/components/schedule/check-in";
import { getEventAttendanceAction } from "@/lib/actions/schedule/attendance";
import { getStudioSession } from "@/lib/actions/schedule/feed";
import { formatDay, studioDateString, toStudioTime, wallClockOf, weekStart } from "@/lib/utils/time";
import { getEventById, type JnaninEventType, withGoogle } from "@/services/google";
import { createClient } from "@/services/supabase/server";

import { format } from "date-fns";
import { ArrowLeft2,Calendar as CalendarIcon } from "iconsax-reactjs";

/** "Wednesday 28 October 2026 at 18:00", from Google's wall clock when there is one. */
function sessionWhen(googleDateTime: string | undefined, instant: Date) {
    const wall = wallClockOf(googleDateTime);
    if (wall) {
        return `${formatDay(wall.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} at ${wall.time}`;
    }
    return format(toStudioTime(instant), "EEEE d MMMM yyyy 'at' HH:mm");
}

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

    const event = await withGoogle(user.id, "Google Calendar", (token) => getEventById(token, eventId));

    // Google couldn't be reached: say so, and keep the way back. Only an event
    // Google says doesn't exist is a "not found".
    if (event.error) {
        return (
            <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-5 py-10">
                <p role="alert" className="bg-card zen-shadow rounded-2xl border p-5 text-sm leading-relaxed">
                    {event.error}
                </p>
                <Link href="/check-in" className="text-primary min-h-[44px] font-semibold">
                    Back to today&apos;s sessions
                </Link>
            </div>
        );
    }

    // Our record: the only trace of a session cancelled here (Google deleted it).
    const record = await getStudioSession(eventId);
    if (!event.data && !record) {
        notFound();
    }

    const details = event.data as {
        summary?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
        extendedProperties?: { private?: { jnaninEventType?: string } };
    } | null;

    const cancelled = record?.status === "cancelled";
    const title = details?.summary || record?.title || "Unnamed Event";
    const startTime = details?.start?.dateTime || details?.start?.date || record?.startsAt.toISOString();
    const endTime = details?.end?.dateTime || details?.end?.date || record?.endsAt.toISOString();
    const type = (details?.extendedProperties?.private?.jnaninEventType as JnaninEventType) || record?.type || "group";
    // Past and cancelled sessions are read-only attendance history, so no one
    // backfills attendees after the fact.
    const isPast = cancelled || (endTime ? new Date(endTime) < new Date() : false);
    const sessionDay = wallClockOf(details?.start?.dateTime)?.date ?? (startTime ? studioDateString(new Date(startTime)) : null);
    const scheduleWeek = sessionDay ? `/schedule?week=${weekStart(sessionDay)}` : "/schedule";

    // Fetch currently checked-in clients
    const attendanceRecords = await getEventAttendanceAction(eventId);

    return (
        <div className="bg-background flex min-h-screen flex-col pb-24 font-sans">
            {/* Zen Header — soft, borderless, with warm surface */}
            <header className="bg-primary/70 zen-shadow relative z-10 rounded-b-3xl px-6 py-8 md:py-10">
                <div className="mx-auto flex max-w-4xl flex-col gap-4">
                    <div className="mb-1 flex items-center justify-between text-sm md:text-base">
                        <Link href={scheduleWeek} className="group text-primary-foreground flex min-h-[48px] items-center font-semibold transition-colors hover:text-white">
                            <ArrowLeft2 className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
                            <span>Back to Schedule</span>
                        </Link>
                        <span className="bg-secondary text-secondary-foreground rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase">
                            {cancelled ? `${type} · Cancelled` : isPast ? `${type} · History` : `${type} Session`}
                        </span>
                    </div>
                    
                    <h1 className="font-vibes text-primary-foreground text-5xl tracking-tight capitalize md:text-7xl">
                        {title}
                    </h1>
                    
                    <div className="text-primary-foreground mt-1 flex items-center gap-2 text-base font-medium">
                        <CalendarIcon className="h-5 w-5 shrink-0" variant="Outline" />
                        {/* The studio's clock: as Google wrote it, or from our record. */}
                        {startTime ? sessionWhen(details?.start?.dateTime, new Date(startTime)) : "Time TBA"}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="relative z-20 mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-5 py-6 md:px-6">
                <CheckInManager
                    eventId={eventId}
                    eventType={type}
                    initialAttendance={attendanceRecords}
                    isPast={isPast}
                    cancelled={cancelled}
                />
            </div>
        </div>
    );
}
