import { type EventPhase } from "@/lib/domain/events/rules";
import { cn } from "@/lib/utils/ui";

const PHASE: Record<EventPhase, { label: string; className: string }> = {
	off: { label: "Not on the website", className: "bg-muted text-muted-foreground" },
	upcoming: { label: "On the website", className: "bg-primary/10 text-primary" },
	closed: { label: "Website bookings closed", className: "bg-warning/10 text-warning" },
	ongoing: { label: "Happening now", className: "bg-success/10 text-success" },
	past: { label: "Past", className: "bg-muted text-muted-foreground" },
	cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive" },
};

/** Where the outdoor session stands as an event, next to its name. */
export function EventStatus({ phase, className }: { phase: EventPhase; className?: string }) {
	const meta = PHASE[phase];
	return <span className={cn("inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-sm font-medium", meta.className, className)}>{meta.label}</span>;
}
