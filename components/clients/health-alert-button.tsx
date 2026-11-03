"use client";

import { alertChipLabel, alertsSummary } from "@/lib/domain/clients/card";
import { notify } from "@/lib/feedback/notify";
import { type HealthLog } from "@/lib/types";
import { cn } from "@/lib/utils/ui";

import { Danger } from "iconsax-reactjs";

/**
 * The one health signal, on the client card and in the client list: a round
 * ⚠ (with a count when there are several). Tapping it lists the alerts in a
 * toast, critical first. Callers show it only when there are active alerts.
 */
export function HealthAlertButton({
	clientName,
	alerts,
	className,
}: {
	clientName: string;
	alerts: HealthLog[];
	className?: string;
}) {
	return (
		<button
			type="button"
			onClick={() => notify.warning(`Health alerts for ${clientName}`, alertsSummary(alerts), 8000)}
			title={alertChipLabel(alerts)}
			aria-label={`Health alerts for ${clientName}: ${alertsSummary(alerts)}`}
			className={cn(
				"relative flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive ring-4 ring-destructive/8 transition-colors hover:bg-destructive/25 active:scale-95",
				className,
			)}
		>
			<Danger size={22} variant="Bold" />
			{alerts.length > 1 ? (
				<span
					aria-hidden
					className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground ring-2 ring-card"
				>
					{alerts.length}
				</span>
			) : null}
		</button>
	);
}
