"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShieldAlert, Users, User, MapPin, CheckCircle2 } from "lucide-react";
import { checkInClientAction } from "@/actions/attendance";
import { ClientSearch } from "./client-search";
import { HealthGuardrailDialog } from "./health-guardrail-dialog";
import { type JnaninEventType } from "@/services/google-calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CheckInManagerProps {
    eventId: string;
    eventType: JnaninEventType | string;
    initialAttendance: any[];
}

export function CheckInManager({ eventId, eventType, initialAttendance }: CheckInManagerProps) {
    const [attendance, setAttendance] = useState(initialAttendance);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [showGuardrail, setShowGuardrail] = useState(false);
    const [isCheckingIn, setIsCheckingIn] = useState(false);

    const onClientSelected = (client: any) => {
        const hasAlerts = client.healthLogs?.some((log: any) => log.isAlert);
        if (hasAlerts) {
            setSelectedClient(client);
            setShowGuardrail(true);
        } else {
            performCheckIn(client.id, client);
        }
    };

    const performCheckIn = async (clientId: string, clientData?: any) => {
        setIsCheckingIn(true);
        try {
            const res = await checkInClientAction(clientId, eventId, eventType as JnaninEventType);
            if (res.success) {
                toast.success(res.message);
                
                const newRecord = {
                    id: Math.random().toString(), 
                    checkInTime: new Date().toISOString(),
                    slotType: eventType,
                    client: {
                        id: clientId,
                        fullName: clientData?.fullName || selectedClient?.fullName,
                        photoUrl: clientData?.photoUrl || selectedClient?.photoUrl,
                        healthLogs: clientData?.healthLogs || selectedClient?.healthLogs 
                    }
                };
                setAttendance(prev => [newRecord, ...prev]);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to check-in client.");
        } finally {
            setIsCheckingIn(false);
            setShowGuardrail(false);
            setSelectedClient(null);
        }
    };

    if (eventType === "private") {
        const checkedInClient = attendance.length > 0 ? attendance[0].client : null;

        return (
            <div className="flex flex-col gap-6 w-full animate-slide-up">
                {!checkedInClient ? (
                    <div className="bg-card zen-shadow-lg p-8 md:p-12 rounded-3xl flex flex-col items-center justify-center min-h-[50vh] gap-8 transition-all">
                        <div className="bg-primary/10 p-6 rounded-full">
                            <User className="w-16 h-16 text-primary" />
                        </div>
                        <div className="text-center flex flex-col gap-2">
                            <h2 className="text-2xl font-heading font-bold text-foreground">Private Session Ready</h2>
                            <p className="text-muted-foreground">Scan or search for the single client attending.</p>
                        </div>
                        <div className="w-full max-w-md mt-4">
                            <ClientSearch onSelectClient={onClientSelected} />
                        </div>
                    </div>
                ) : (
                    <div className="bg-card zen-shadow-lg p-6 md:p-10 rounded-3xl flex flex-col gap-8 transition-all relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-accent rounded-t-3xl"></div>
                        <div className="flex flex-col items-center gap-5 border-b border-muted pb-8">
                            <div className="relative">
                                <Avatar className="size-32 zen-shadow-md ring-4 ring-card">
                                    <AvatarImage src={checkedInClient.photoUrl || undefined} />
                                    <AvatarFallback className="text-4xl bg-primary/10 text-primary font-bold">{checkedInClient.fullName[0]}</AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-2 right-2 bg-card rounded-full p-1 zen-shadow">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                </div>
                            </div>
                            <div className="text-center flex flex-col gap-1">
                                <h2 className="text-3xl font-heading font-bold text-foreground">{checkedInClient.fullName}</h2>
                                <span className="text-emerald-600 font-semibold flex items-center gap-1.5 justify-center tracking-wide uppercase text-sm mt-2 bg-emerald-50 px-4 py-1.5 rounded-full w-max mx-auto">
                                    <span className="relative flex size-2.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500"></span>
                                    </span>
                                    Successfully Checked In
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <h3 className="font-heading font-bold text-xl flex items-center gap-2 text-foreground">
                                <ShieldAlert className="w-6 h-6 text-amber-500" />
                                Health Guardrails
                            </h3>
                            <div className="bg-muted rounded-2xl p-5 md:p-6 max-h-[45vh] overflow-y-auto">
                                {checkedInClient.healthLogs?.filter((l:any)=> l.isAlert).length > 0 ? (
                                    <ul className="grid gap-4 md:grid-cols-2">
                                        {checkedInClient.healthLogs.filter((l:any)=> l.isAlert).map((log: any) => (
                                            <li key={log.id} className="relative overflow-hidden bg-card p-5 rounded-2xl zen-shadow border-l-4 border-l-amber-400 transition-all hover:zen-shadow-md hover:-translate-y-0.5">
                                                <div className="flex justify-between items-start">
                                                    <strong className="block text-foreground capitalize font-bold text-lg">{log.category}</strong>
                                                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                                                        log.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>{log.severity}</span>
                                                </div>
                                                <p className="text-muted-foreground mt-2 font-medium">{log.condition}</p>
                                                {log.treatment && <p className="text-sm text-muted-foreground mt-2 pt-2 border-t border-muted">{log.treatment}</p>}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                        <div className="size-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
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
                    onAcknowledge={() => performCheckIn(selectedClient.id)}
                    onCancel={() => { setShowGuardrail(false); setSelectedClient(null); }}
                    isPending={isCheckingIn}
                />
            </div>
        );
    }

    // Group / Outdoor View
    return (
        <div className="flex flex-col gap-6 w-full animate-slide-up">
            {/* Search Bar Block — Zen Glass Surface */}
            <div className="zen-glass zen-shadow-glow p-5 md:p-6 rounded-3xl sticky top-[72px] z-30 transition-all">
                <ClientSearch onSelectClient={onClientSelected} />
            </div>

            {/* Manifest List */}
            <div className="bg-card zen-shadow-lg p-6 md:p-8 rounded-3xl flex-1 min-h-[50vh]">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-muted">
                    <h2 className="text-lg md:text-xl font-heading font-bold flex items-center gap-3 text-foreground">
                        {eventType === "outdoor" ? (
                            <div className="bg-emerald-50 p-2 rounded-2xl"><MapPin className="w-5 h-5 text-emerald-600" /></div>
                        ) : (
                            <div className="bg-primary/10 p-2 rounded-2xl"><Users className="w-5 h-5 text-primary" /></div>
                        )}
                        Active Manifest
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground font-medium hidden sm:block">Total Check-ins</span>
                        <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-bold">
                            {attendance.length}
                        </span>
                    </div>
                </div>

                {attendance.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Users className="w-20 h-20 mb-6 opacity-15" />
                        <h3 className="text-xl font-heading font-semibold text-foreground/60">The studio is empty</h3>
                        <p className="text-muted-foreground mt-2 text-center max-w-sm">Use the search bar above to begin checking clients into the session.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {attendance.map((record, index) => (
                            <div 
                                key={record.id} 
                                className="group flex items-center gap-4 p-4 bg-card rounded-2xl zen-shadow hover:zen-shadow-md transition-all duration-300 ease-out hover:-translate-y-0.5 animate-slide-up"
                                style={{ animationFillMode: "both", animationDelay: `${index * 50}ms`, animationDuration: '400ms' }}
                            >
                                <div className="relative">
                                    <Avatar className="size-14 md:size-16 zen-shadow ring-2 ring-card">
                                        <AvatarImage src={record.client.photoUrl || undefined} />
                                        <AvatarFallback className="text-lg bg-muted text-muted-foreground font-bold">{record.client.fullName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-0.5 shadow-sm">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    </div>
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="font-bold text-foreground text-lg truncate pr-2 group-hover:text-primary transition-colors">{record.client.fullName}</span>
                                    <span className="text-sm text-muted-foreground font-medium mt-0.5">
                                        Checked in at {new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="hidden sm:flex items-center bg-muted px-3 py-2 rounded-full ml-2">
                                    <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Ready</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <HealthGuardrailDialog
                isOpen={showGuardrail}
                clientData={selectedClient}
                onAcknowledge={() => performCheckIn(selectedClient.id)}
                onCancel={() => { setShowGuardrail(false); setSelectedClient(null); }}
                isPending={isCheckingIn}
            />
        </div>
    );
}
