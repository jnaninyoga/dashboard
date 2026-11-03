import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CheckInManager } from "@/components/schedule/check-in";
import { CheckInHeader, type SessionMoment } from "@/components/schedule/check-in-header";
import { getProducts } from "@/lib/actions/price-list";
import { getEventAttendanceAction, getUsualAttendees } from "@/lib/actions/schedule/attendance";
import { getStudioSession } from "@/lib/actions/schedule/feed";
import { getDiscounts } from "@/lib/actions/settings";
import { formatDay, studioDateString, toStudioTime, wallClockOf, weekStart } from "@/lib/utils/time";
import { getEventById, type JnaninEventType, withGoogle } from "@/services/google";
import { createClient } from "@/services/supabase/server";

import { format } from "date-fns";

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
                <p role="alert" className="zen-shadow rounded-2xl border bg-card p-5 text-sm leading-relaxed">
                    {event.error}
                </p>
                <Link href="/check-in" className="min-h-[44px] font-semibold text-primary">
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

    // Who's in, and, while the door is open, the regulars and what she can sell.
    const [attendanceRecords, usual, memberships, discounts] = await Promise.all([
        getEventAttendanceAction(eventId),
        isPast ? [] : getUsualAttendees(eventId, title),
        isPast ? [] : getProducts("membership"),
        isPast ? [] : getDiscounts(),
    ]);

    const now = new Date();
    const starts = startTime ? new Date(startTime) : null;
    const moment: SessionMoment = cancelled
        ? "cancelled"
        : isPast
            ? "ended"
            : starts && now < new Date(starts.getTime() - 15 * 60_000)
                ? "upcoming"
                : "live";
    const fromTo = [details?.start?.dateTime ?? startTime, details?.end?.dateTime ?? endTime].map(
        (iso) => (iso ? (wallClockOf(iso)?.time ?? format(toStudioTime(new Date(iso)), "HH:mm")) : null),
    );
    const when = sessionDay
        ? `${formatDay(sessionDay, { weekday: "long", day: "numeric", month: "long" })}${fromTo[0] ? ` · ${fromTo[0]}${fromTo[1] ? ` – ${fromTo[1]}` : ""}` : ""}`
        : "Time to be set";

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <CheckInHeader title={title} type={type} when={when} moment={moment} startsAt={fromTo[0] ?? undefined} backHref={scheduleWeek} />
            <CheckInManager
                eventId={eventId}
                eventType={type}
                initialAttendance={attendanceRecords}
                isPast={isPast}
                cancelled={cancelled}
                usual={usual}
                memberships={memberships}
                discounts={discounts.filter((discount) => !discount.isArchived)}
            />
        </div>
    );
}
