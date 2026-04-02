"use client";

import { format, isWithinInterval, subMinutes, parseISO } from "date-fns";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, LinkCircle } from "iconsax-reactjs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function EventCard({ event }: { event: any }) {
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
            "group flex flex-col md:flex-row md:items-center justify-between border-0 transition-all duration-300 ease-out overflow-hidden rounded-3xl",
            isLive ? "bg-card zen-shadow-md ring-1 ring-primary/20 hover:-translate-y-0.5" 
                    : "bg-card zen-shadow opacity-95"
        )}>
            <div className="p-6 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-1.5">
                    <Badge variant={badgeVariant} className="uppercase text-[10px] tracking-wider rounded-full font-bold px-3 py-1 shadow-none border-0">{badgeText}</Badge>
                    {isLive && (
                        <span className="inline-flex items-center">
                            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse mr-1.5 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                            <span className="text-[11px] font-bold text-destructive uppercase tracking-widest">Active</span>
                        </span>
                    )}
                </div>
                <CardTitle className="text-3xl capitalize font-vibes font-semibold truncate pr-2 text-foreground" title={event.summary}>
                    {event.summary || "Untitled Event"}
                </CardTitle>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2.5 font-medium">
                    <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                        {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                    </span>
                    <TooltipProvider delayDuration={150}>
                    {calendarLink && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <a
                                    href={calendarLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Open in Google Calendar"
                                    className="inline-flex items-center gap-1 text-muted-foreground/60 hover:text-primary transition-colors duration-200"
                                >
                                    <LinkCircle className="w-4 h-4" variant="Bulk" />
                                </a>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Open in Google Calendar</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                    </TooltipProvider>
                </div>
            </div>
            
            <div className="p-5 md:p-6 md:pl-0 md:bg-transparent mt-auto md:mt-0">
                <Button asChild className={cn("w-full md:w-auto min-h-[48px] md:min-h-[44px] px-8 rounded-2xl font-semibold transition-all", isLive && "zen-glow-teal")} variant={isLive ? "default" : "secondary"}>
                    <Link href={`/check-in/${event.id}`}>
                        Check In
                    </Link>
                </Button>
            </div>
        </Card>
    );
}
