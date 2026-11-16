import { cn } from "@/lib/utils/ui";
import { type BookingRequest } from "@/services/database/schema";

const STATUS = {
	new: { label: "New", className: "bg-primary/10 text-primary", dot: "bg-primary" },
	confirmed: { label: "Confirmed", className: "bg-success/10 text-success", dot: "bg-success" },
	declined: { label: "Declined", className: "bg-muted text-muted-foreground", dot: "bg-muted-foreground/60" },
} as const;

/** A request's status, next to the name: New (waiting for her answer), Confirmed or Declined. */
export function RequestStatus({ status, className }: { status: BookingRequest["status"]; className?: string }) {
	const meta = STATUS[status];
	return (
		<span
			className={cn(
				"inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium",
				meta.className,
				className,
			)}
		>
			<span aria-hidden className={cn("size-1.5 rounded-full", meta.dot)} />
			{meta.label}
		</span>
	);
}
