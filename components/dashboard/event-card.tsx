"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

import { format, isWithinInterval, parseISO,subMinutes } from "date-fns";
import { Clock, LinkCircle } from "iconsax-reactjs";

export function EventCard({ event }: { event: CalendarEvent }) {
    const calendarLink = event.htmlLink as string | undefined;
    const startIso = event.start?.dateTime;
    const endIso = event.end?.dateTime;
    
    if (!startIso || !endIso) return null; // Ignore all-day events for now

    const startTime = parseISO(startIso);
    const endTime = parseISO(endIso);
    const now = new Date();

    // Live if 'now' is between 15 mins before start and endTime
    const isLive = isWithinInterval(now, {
        start: subMinutes(startTime, 15),
        end: endTime
    });

    const eventType = event.extendedProperties?.private?.jnaninEventType as string | undefined;
    const outdoorPrice = event.extendedProperties?.private?.outdoorPrice as string | undefined;

    let badgeText = "Session";
    let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";

    switch (eventType) {
        case "group":
            badgeText = "Group Class";
            badgeVariant = "default";
            break;
        case "private":
            badgeText = "Private";
            badgeVariant = "secondary";
            break;
        case "b2b":
            badgeText = "B2B";
            badgeVariant = "destructive";
            break;
        case "outdoor":
            badgeText = `Outdoor (${outdoorPrice} MAD)`;
            badgeVariant = "outline"; 
            break;
    }

    return (
        <Card className={cn(
            "group flex flex-col justify-between overflow-hidden rounded-3xl border-0 transition-all duration-300 ease-out md:flex-row md:items-center",
            isLive ? "bg-card zen-shadow-md ring-primary/20 ring-1 hover:-translate-y-0.5" 
                    : "bg-card zen-shadow opacity-95"
        )}>
            <div className="flex flex-1 flex-col justify-center p-6">
                <div className="mb-1.5 flex items-center gap-3">
                    <Badge variant={badgeVariant} className="rounded-full border-0 px-3 py-1 text-[10px] font-bold tracking-wider uppercase shadow-none">{badgeText}</Badge>
                    {isLive ? (
                        <span className="inline-flex items-center">
                            <span className="bg-destructive mr-1.5 h-2 w-2 animate-pulse rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                            <span className="text-destructive text-[11px] font-bold tracking-widest uppercase">Active</span>
                        </span>
                    ) : null}
                </div>
                <CardTitle className="font-vibes text-foreground pr-2 text-3xl font-semibold capitalize" title={event.summary ?? undefined}>
                    {event.summary || "Untitled Event"}
                </CardTitle>
                <div className="text-muted-foreground mt-2.5 flex items-center gap-3 text-sm font-medium">
                    <span className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                        {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                    </span>
                    <TooltipProvider delayDuration={150}>
                    {calendarLink ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <a
                                    href={calendarLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Open in Google Calendar"
                                    className="text-muted-foreground/60 hover:text-primary inline-flex items-center gap-1 transition-colors duration-200"
                                >
                                    <LinkCircle className="h-4 w-4" variant="Bulk" />
                                </a>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Open in Google Calendar</p>
                            </TooltipContent>
                        </Tooltip>
                    ) : null}
                    </TooltipProvider>
                </div>
            </div>
            
            <div className="mt-auto p-5 md:mt-0 md:bg-transparent md:p-6 md:pl-0">
                <Button asChild className={cn("min-h-[48px] w-full rounded-2xl px-8 font-semibold transition-all md:min-h-[44px] md:w-auto", isLive && "zen-glow-teal")} variant={isLive ? "default" : "secondary"}>
                    <Link href={`/check-in/${event.id}`}>
                        Check In
                    </Link>
                </Button>
            </div>
        </Card>
    );
}
