import { cn } from "@/lib/utils/ui";

import { Clock, CloseCircle, Edit2, type Icon, MoneyTime, Send2, TickCircle, TickSquare } from "iconsax-reactjs";

type Tone = "success" | "warning" | "info" | "primary" | "destructive" | "muted";

// A document's status in the dashboard's chip language (like "Here today"):
// a soft tint, sentence case, a small icon. Owing is amber, settled is green.
const STATUS: Record<string, { label: string; tone: Tone; icon: Icon }> = {
	draft: { label: "Draft", tone: "muted", icon: Edit2 },
	sent: { label: "Sent", tone: "info", icon: Send2 },
	accepted: { label: "Accepted", tone: "primary", icon: TickSquare },
	unpaid: { label: "Unpaid", tone: "warning", icon: Clock },
	partially_paid: { label: "Partly paid", tone: "warning", icon: MoneyTime },
	paid: { label: "Paid", tone: "success", icon: TickCircle },
	cancelled: { label: "Cancelled", tone: "destructive", icon: CloseCircle },
};

const TONES: Record<Tone, string> = {
	success: "bg-success/10 text-success",
	warning: "bg-warning/10 text-warning",
	info: "bg-info/10 text-info",
	primary: "bg-primary/10 text-primary",
	destructive: "bg-destructive/10 text-destructive",
	muted: "bg-muted text-muted-foreground",
};

export function DocumentStatusBadge({ status, className }: { status: string; className?: string }) {
	const { label, tone, icon: StatusIcon } = STATUS[status.toLowerCase()] ?? STATUS.draft;
	return (
		<span
			className={cn(
				"inline-flex h-7 w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium whitespace-nowrap",
				TONES[tone],
				className,
			)}
		>
			<StatusIcon size={14} variant="Bold" aria-hidden />
			{label}
		</span>
	);
}
