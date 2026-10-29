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
				"relative flex size-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 ring-4 ring-red-50 transition-colors hover:bg-red-200 active:scale-95 dark:bg-red-500/20 dark:text-red-300 dark:ring-red-500/10",
				className,
			)}
		>
			<Danger size={22} variant="Bold" />
			{alerts.length > 1 ? (
				<span
					aria-hidden
					className="ring-card absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white ring-2"
				>
					{alerts.length}
				</span>
			) : null}
		</button>
	);
}
