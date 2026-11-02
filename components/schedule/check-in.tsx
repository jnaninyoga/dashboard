"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { checkInClientAction } from "@/lib/actions/schedule/attendance";
import { type AttendanceRecord } from "@/lib/actions/schedule/attendance";
import { notify } from "@/lib/feedback/notify";
import { toStudioTime } from "@/lib/utils/time";
import { type Client, type HealthLog } from "@/services/database/schema";
import { type JnaninEventType } from "@/services/google";

import { format } from "date-fns";
import { ArrowRotateLeft, CloseCircle, Danger, Location, People, SecurityUser, TickCircle, User } from "iconsax-reactjs";

import { ClientSearch } from "../clients/search";

import { HealthGuardrailDialog } from "./health-guardrail";

type ClientWithLogs = Client & { healthLogs?: HealthLog[] };

interface CheckInManagerProps {
    eventId: string;
    eventType: JnaninEventType | string;
    initialAttendance: AttendanceRecord[];
    isPast?: boolean;
    /** The session was cancelled: history only, and the credits went back. */
    cancelled?: boolean;
}

export function CheckInManager({ eventId, eventType, initialAttendance, isPast = false, cancelled = false }: CheckInManagerProps) {
    const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
    const [selectedClient, setSelectedClient] = useState<ClientWithLogs | null>(null);
    const [showGuardrail, setShowGuardrail] = useState(false);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    // Why the last client tapped wasn't let in. It stays until she acts on
    // it or checks someone in: a toast would be gone before she reads it.
    const [refusal, setRefusal] = useState<{ clientId: string; name: string; message: string; needsCard: boolean } | null>(null);

    const onClientSelected = (client: ClientWithLogs) => {
        if (isPast) return; // safety: past events are read-only
        const hasAlerts = client.healthLogs?.some((log) => log.isAlert);
        if (hasAlerts) {
            setSelectedClient(client);
            setShowGuardrail(true);
        } else {
            performCheckIn(client.id, client);
        }
    };

    // Synchronous latch: state updates land a render late, so a fast double
    // tap would otherwise fire two check-ins.
    const checkInInFlight = useRef(false);

    const performCheckIn = async (clientId: string, clientData?: ClientWithLogs) => {
        if (checkInInFlight.current) return;
        checkInInFlight.current = true;
        setIsCheckingIn(true);
        try {
            const res = await checkInClientAction(clientId, eventId, eventType as JnaninEventType);
            if (!res.success) {
                if (res.ref) notify.error(res.message, { code: res.ref });
                else {
                    const name = clientData?.fullName || selectedClient?.fullName || "This client";
                    setRefusal({ clientId, name, message: res.message, needsCard: !!res.needsCard });
                }
            } else {
                setRefusal(null);
                notify.success(res.message);
                
                const newRecord: AttendanceRecord = {
                    id: Math.random().toString(), 
                    checkInTime: new Date().toISOString(),
                    cancelledAt: null,
                    slotType: eventType as JnaninEventType,
                    client: {
                        id: clientId,
                        fullName: clientData?.fullName || selectedClient?.fullName || "Unknown",
                        photoUrl: clientData?.photoUrl || selectedClient?.photoUrl || null,
                        healthLogs: clientData?.healthLogs || selectedClient?.healthLogs 
                    }
                };
                setAttendance(prev => [newRecord, ...prev]);
            }
        } catch (error: unknown) {
            const err = error as { message?: string };
            notify.error(err.message || "Failed to check-in client.");
        } finally {
            checkInInFlight.current = false;
            setIsCheckingIn(false);
            setShowGuardrail(false);
            setSelectedClient(null);
        }
    };

    const refusalNotice = refusal ? (
        <div role="alert" className="border-destructive/25 bg-destructive/5 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-3xl border p-4 md:p-5">
            <Danger className="text-destructive size-7 shrink-0" variant="Bulk" />
            <div className="min-w-0 flex-1 basis-56">
                <p className="text-foreground font-semibold">{refusal.name} isn&apos;t checked in</p>
                <p className="text-muted-foreground text-sm">{refusal.message}</p>
            </div>
            <div className="flex items-center gap-2">
                {refusal.needsCard ? (
                    <Button asChild className="h-10 rounded-xl font-semibold">
                        <Link href={`/clients/${refusal.clientId}?sell=1`}>Sell a membership</Link>
                    </Button>
                ) : null}
                <Button variant="ghost" size="icon" aria-label="Dismiss" className="size-10 rounded-xl" onClick={() => setRefusal(null)}>
                    <CloseCircle className="size-5" variant="Outline" />
                </Button>
            </div>
        </div>
    ) : null;

    if (eventType === "private") {
        const checkedInClient = attendance.length > 0 ? attendance[0].client : null;

        return (
            <div className="animate-slide-up flex w-full flex-col gap-6">
                {refusalNotice}
                {!checkedInClient ? (
                    <div className="bg-card zen-shadow-lg flex min-h-[50vh] flex-col items-center justify-center gap-8 rounded-3xl p-8 transition-all md:p-12">
                        <div className="bg-muted rounded-full p-6">
                            <User className="text-muted-foreground h-16 w-16" variant="Outline" />
                        </div>
                        <div className="flex flex-col gap-2 text-center">
                            <h2 className="font-heading text-foreground text-2xl font-bold">
                                {isPast ? "No Attendance Recorded" : "Private Session Ready"}
                            </h2>
                            <p className="text-muted-foreground">
                                {isPast
                                    ? "This private session ended with no client checked in."
                                    : "Scan or search for the single client attending."}
                            </p>
                        </div>
                        {!isPast ? (
                            <div className="mt-4 w-full max-w-md">
                                <ClientSearch onSelectClient={onClientSelected} />
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <div className="bg-card zen-shadow-lg relative flex flex-col gap-8 overflow-hidden rounded-3xl p-6 transition-all md:p-10">
                        <div className="from-primary to-accent absolute top-0 left-0 h-1.5 w-full rounded-t-3xl bg-linear-to-r"></div>
                        <div className="border-muted flex flex-col items-center gap-5 border-b pb-8">
                            <div className="relative">
                                <Avatar className="zen-shadow-md ring-card size-32 ring-4">
                                    <AvatarImage src={checkedInClient.photoUrl || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-4xl font-bold">{checkedInClient.fullName[0]}</AvatarFallback>
                                </Avatar>
                                <div className="bg-card zen-shadow absolute right-2 bottom-2 rounded-full p-1">
                                    <TickCircle className="text-success h-8 w-8" variant="Bulk" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 text-center">
                                <h2 className="font-heading text-foreground text-3xl font-bold">{checkedInClient.fullName}</h2>
                                <span className="bg-success/10 text-success mx-auto mt-2 flex w-max items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold tracking-wide uppercase">
                                    <span className="relative flex size-2.5">
                                      <span className="bg-success/70 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
                                      <span className="bg-success relative inline-flex size-2.5 rounded-full"></span>
                                    </span>
                                    Successfully Checked In
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <h3 className="font-heading text-foreground flex items-center gap-2 text-xl font-bold">
                                <SecurityUser className="text-warning h-6 w-6" variant="Outline" />
                                Health Guardrails
                            </h3>
                            <div className="bg-muted max-h-[45vh] overflow-y-auto rounded-2xl p-5 md:p-6">
                                {(checkedInClient.healthLogs || []).filter((l)=> l.isAlert).length > 0 ? (
                                    <ul className="grid gap-4 md:grid-cols-2">
                                        {(checkedInClient.healthLogs || []).filter((l)=> l.isAlert).map((log) => (
                                            <li key={log.id} className="bg-card zen-shadow hover:zen-shadow-md relative overflow-hidden rounded-2xl border-l-4 border-l-amber-400 p-5 transition-all hover:-translate-y-0.5">
                                                <div className="flex items-start justify-between">
                                                    <strong className="text-foreground block text-lg font-bold capitalize">{log.category}</strong>
                                                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                                                        log.severity === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                                                    }`}>{log.severity}</span>
                                                </div>
                                                <p className="text-muted-foreground mt-2 font-medium">{log.condition}</p>
                                                {log.treatment ? (
                                                    <p className="text-muted-foreground border-muted mt-2 border-t pt-2 text-sm">
                                                        {log.treatment}
                                                    </p>
                                                ) : null}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-muted-foreground flex flex-col items-center justify-center py-8">
                                        <div className="bg-success/10 mb-3 flex size-12 items-center justify-center rounded-full">
                                            <TickCircle className="text-success h-6 w-6" variant="Bulk" />
                                        </div>
                                        <p className="font-medium">No active health alerts.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <HealthGuardrailDialog
                    isOpen={showGuardrail}
                    clientData={selectedClient}
                    onAcknowledge={() => selectedClient && performCheckIn(selectedClient.id)}
                    onCancel={() => { setShowGuardrail(false); setSelectedClient(null); }}
                    isPending={isCheckingIn}
                />
            </div>
        );
    }

    // Group / Outdoor View
    return (
        <div className="animate-slide-up flex w-full flex-col gap-6">
            {/* Search Bar — hidden in read-only history mode so operators can't backfill attendees */}
            {!isPast ? (
                <div className="zen-glass zen-shadow-glow sticky top-[72px] z-30 rounded-3xl p-5 transition-all md:p-6">
                    <ClientSearch onSelectClient={onClientSelected} />
                </div>
            ) : null}
            {refusalNotice}

            {/* Manifest List */}
            <div className="bg-card zen-shadow-lg min-h-[50vh] flex-1 rounded-3xl p-6 md:p-8">
                <div className="border-muted mb-8 flex items-center justify-between border-b pb-4">
                    <h2 className="font-heading text-foreground flex items-center gap-3 text-lg font-bold md:text-xl">
                        {eventType === "outdoor" ? (
                            <div className="bg-success/10 rounded-2xl p-2"><Location className="text-success h-5 w-5" variant="Outline" /></div>
                        ) : (
                            <div className="bg-primary/10 rounded-2xl p-2"><People className="text-primary h-5 w-5" variant="Outline" /></div>
                        )}
                        {cancelled ? "Cancelled session" : isPast ? "Attendance Record" : "Active Manifest"}
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground hidden text-sm font-medium sm:block">
                            {isPast ? "Total Present" : "Total Check-ins"}
                        </span>
                        <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 font-bold">
                            {attendance.length}
                        </span>
                    </div>
                </div>

                {attendance.length === 0 ? (
                    <div className="text-muted-foreground flex flex-col items-center justify-center py-20">
                        <People className="mb-6 h-20 w-20 opacity-15" variant="Outline" />
                        <h3 className="font-heading text-foreground/60 text-xl font-semibold">
                            {cancelled ? "No one had checked in" : isPast ? "No one was checked in" : "The studio is empty"}
                        </h3>
                        <p className="text-muted-foreground mt-2 max-w-sm text-center">
                            {cancelled
                                ? "The session was cancelled before anyone checked in."
                                : isPast
                                ? "This session ended with no attendance recorded."
                                : "Use the search bar above to begin checking clients into the session."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {attendance.map((record, index) => (
                            <div 
                                key={record.id} 
                                className="group bg-card zen-shadow hover:zen-shadow-md animate-slide-up flex items-center gap-4 rounded-2xl p-4 transition-all duration-300 ease-out hover:-translate-y-0.5"
                                style={{ animationFillMode: "both", animationDelay: `${index * 50}ms`, animationDuration: '400ms' }}
                            >
                                <div className="relative">
                                    <Avatar className="zen-shadow ring-card size-14 ring-2 md:size-16">
                                        <AvatarImage src={record.client.photoUrl || undefined} />
                                        <AvatarFallback className="bg-muted text-muted-foreground text-lg font-bold">{record.client.fullName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="bg-card absolute -right-1 -bottom-1 rounded-full p-0.5 shadow-sm">
                                        {record.cancelledAt ? (
                                            <ArrowRotateLeft className="text-muted-foreground h-5 w-5" variant="Bulk" />
                                        ) : (
                                            <TickCircle className="text-success h-5 w-5" variant="Bulk" />
                                        )}
                                    </div>
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="text-foreground group-hover:text-primary truncate pr-2 text-lg font-bold transition-colors">{record.client.fullName}</span>
                                    <span className="text-muted-foreground mt-0.5 text-sm font-medium">
                                        Checked in at {format(toStudioTime(new Date(record.checkInTime)), "HH:mm")}
                                        {record.cancelledAt ? " · credit given back" : null}
                                    </span>
                                </div>
                                <div className="bg-muted ml-2 hidden items-center rounded-full px-3 py-2 sm:flex">
                                    <span className="text-muted-foreground text-xs font-extrabold tracking-wider uppercase">Ready</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <HealthGuardrailDialog
                isOpen={showGuardrail}
                clientData={selectedClient}
                onAcknowledge={() => selectedClient && performCheckIn(selectedClient.id)}
                onCancel={() => { setShowGuardrail(false); setSelectedClient(null); }}
                isPending={isCheckingIn}
            />
        </div>
    );
}
