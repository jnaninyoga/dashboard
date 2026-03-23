"use client";

import { format, isWithinInterval, subMinutes, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function EventCard({ event }: { event: any }) {
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
            badgeVariant = "default"; // Usually blue/primary
            break;
        case "private":
            badgeText = "Private";
            badgeVariant = "secondary"; // Maybe orange styled in theme
            break;
        case "b2b":
            badgeText = "B2B";
            badgeVariant = "destructive"; // Red
            break;
        case "outdoor":
            badgeText = `Outdoor (${outdoorPrice} MAD)`;
            badgeVariant = "outline"; 
            break;
    }

    return (
        <Card className={cn(
            "transition-all",
            isLive ? "border-primary shadow-md ring-1 ring-primary/20" : "opacity-90 grayscale-[0.2]"
        )}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-md truncate pr-2" title={event.summary}>
                    {event.summary || "Untitled Event"}
                </CardTitle>
                <Badge variant={badgeVariant}>{badgeText}</Badge>
            </CardHeader>
            <CardContent>
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <Clock className="w-4 h-4 mr-2" />
                    {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                    
                    {isLive && (
                        <span className="ml-auto inline-flex items-center">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
                            <span className="text-xs font-semibold text-green-600 dark:text-green-500">Live</span>
                        </span>
                    )}
                </div>
            </CardContent>
            <CardFooter className="pt-2 pb-4">
                <Button asChild className="w-full" variant={isLive ? "default" : "secondary"}>
                    <Link href={`/check-in/${event.id}`}>
                        Manage Check-in
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
