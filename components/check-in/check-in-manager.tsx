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
            <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                {!checkedInClient ? (
                    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl ring-1 ring-black/5 flex flex-col items-center justify-center min-h-[50vh] gap-8 transition-all">
                        <div className="bg-blue-50 p-6 rounded-full">
                            <User className="w-16 h-16 text-blue-500" />
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-gray-800">Private Session Ready</h2>
                            <p className="text-gray-500">Scan or search for the single client attending.</p>
                        </div>
                        <div className="w-full max-w-md mt-4 relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative">
                                <ClientSearch onSelectClient={onClientSelected} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/90 backdrop-blur-xl p-6 md:p-10 rounded-2xl shadow-xl ring-1 ring-black/5 flex flex-col gap-8 transition-all relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-500"></div>
                        <div className="flex flex-col items-center gap-5 border-b border-gray-100 pb-8">
                            <div className="relative">
                                <Avatar className="w-32 h-32 shadow-2xl ring-4 ring-white">
                                    <AvatarImage src={checkedInClient.photoUrl || undefined} />
                                    <AvatarFallback className="text-4xl bg-blue-100 text-blue-700 font-bold">{checkedInClient.fullName[0]}</AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow-md">
                                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                                </div>
                            </div>
                            <div className="text-center space-y-1">
                                <h2 className="text-3xl font-extrabold text-gray-900">{checkedInClient.fullName}</h2>
                                <span className="text-green-600 font-semibold flex items-center gap-1.5 justify-center tracking-wide uppercase text-sm mt-2 bg-green-50 px-3 py-1 rounded-full w-max mx-auto">
                                    <span className="relative flex h-2.5 w-2.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                    </span>
                                    Successfully Checked In
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <h3 className="font-bold text-xl flex items-center gap-2 text-gray-800">
                                <ShieldAlert className="w-6 h-6 text-amber-500" />
                                Health Guardrails
                            </h3>
                            <div className="bg-gray-50/80 rounded-xl p-5 md:p-6 shadow-inner max-h-[45vh] overflow-y-auto">
                                {checkedInClient.healthLogs?.filter((l:any)=> l.isAlert).length > 0 ? (
                                    <ul className="grid gap-4 md:grid-cols-2">
                                        {checkedInClient.healthLogs.filter((l:any)=> l.isAlert).map((log: any) => (
                                            <li key={log.id} className="relative overflow-hidden bg-white p-4 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-amber-500 transition-all hover:shadow-md hover:-translate-y-0.5">
                                                <div className="flex justify-between items-start">
                                                    <strong className="block text-gray-900 capitalize font-bold text-lg">{log.category}</strong>
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${
                                                        log.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>{log.severity}</span>
                                                </div>
                                                <p className="text-gray-600 mt-2 font-medium">{log.condition}</p>
                                                {log.treatment && <p className="text-sm text-gray-500 mt-2 pt-2 border-t border-gray-100">{log.treatment}</p>}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                            <CheckCircle2 className="w-6 h-6 text-green-500" />
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
        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            {/* Search Bar Block with Glassmorphism */}
            <div className="bg-white/80 backdrop-blur-xl p-5 md:p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/5 sticky top-[90px] z-30 transition-all group">
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                    <div className="relative">
                       <ClientSearch onSelectClient={onClientSelected} />
                    </div>
                </div>
            </div>

            {/* Manifest List */}
            <div className="bg-white/90 backdrop-blur-xl p-5 md:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/5 flex-1 min-h-[50vh]">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                    <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-gray-800">
                        {eventType === "outdoor" ? (
                            <div className="bg-green-100 p-2 rounded-lg"><MapPin className="w-6 h-6 text-green-600" /></div>
                        ) : (
                            <div className="bg-blue-100 p-2 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
                        )}
                        Active Manifest
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 font-medium hidden sm:block">Total Check-ins</span>
                        <span className="bg-gray-900 text-white px-4 py-1.5 rounded-full font-bold text-lg shadow-sm">
                            {attendance.length}
                        </span>
                    </div>
                </div>

                {attendance.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Users className="w-20 h-20 mb-6 opacity-20" />
                        <h3 className="text-xl font-semibold text-gray-500">The studio is empty</h3>
                        <p className="text-gray-400 mt-2 text-center max-w-sm">Use the search bar above to begin checking clients into the session.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {attendance.map((record, index) => (
                            <div 
                                key={record.id} 
                                className="group flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 ease-out hover:-translate-y-1 animate-in fade-in zoom-in-95"
                                style={{ animationFillMode: "both", animationDelay: `${index * 50}ms`, animationDuration: '400ms' }}
                            >
                                <div className="relative">
                                    <Avatar className="h-14 w-14 md:h-16 md:w-16 shadow-md ring-2 ring-white">
                                        <AvatarImage src={record.client.photoUrl || undefined} />
                                        <AvatarFallback className="text-lg bg-gray-100 text-gray-600 font-bold">{record.client.fullName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    </div>
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="font-bold text-gray-900 text-lg truncate pr-2 group-hover:text-blue-700 transition-colors">{record.client.fullName}</span>
                                    <span className="text-sm text-gray-500 font-medium mt-0.5">
                                        Checked in at {new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="hidden sm:flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 ml-2 shadow-inner">
                                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">Ready</span>
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
