"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { sortAlerts } from "@/lib/domain/clients/card";
import { cn } from "@/lib/utils/ui";
import { type Client, type HealthLog } from "@/services/database/schema";

import { Danger } from "iconsax-reactjs";

const AREA: Record<string, string> = { physical: "Body", mental: "Mind", lifestyle: "Lifestyle" };

/**
 * Before a client with health alerts joins the class: she reads them, then
 * checks them in (or doesn't).
 */
export function HealthGuardrailDialog({
	isOpen,
	clientData,
	onAcknowledge,
	onCancel,
	isPending,
}: {
	isOpen: boolean;
	clientData: (Client & { healthLogs?: HealthLog[] }) | null;
	onAcknowledge: () => void;
	onCancel: () => void;
	isPending: boolean;
}) {
	if (!clientData) return null;
	const alerts = sortAlerts((clientData.healthLogs || []).filter((log) => log.isAlert));
	const first = clientData.fullName.trim().split(/\s+/)[0];

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onCancel()}>
			<DialogContent className="rounded-3xl sm:max-w-md">
				<DialogHeader>
					<span className="bg-destructive/10 text-destructive mb-1 flex size-11 items-center justify-center rounded-full max-sm:mx-auto">
						<Danger size={24} variant="Bulk" />
					</span>
					<DialogTitle className="font-heading text-xl">{first} has health alerts</DialogTitle>
					<DialogDescription>Read them before {first} joins the class.</DialogDescription>
				</DialogHeader>

				<ul className="-mx-1 grid max-h-[50vh] gap-2 overflow-y-auto px-1">
					{alerts.map((log) => (
						<li
							key={log.id}
							className={cn(
								"rounded-2xl border-l-4 px-4 py-3",
								log.severity === "critical" ? "bg-destructive/5 border-l-destructive" : "bg-warning/5 border-l-warning",
							)}
						>
							<p className="text-muted-foreground text-xs font-medium">
								{AREA[log.category] ?? "Health"}
								{log.severity === "critical" ? <span className="text-destructive">, critical</span> : null}
							</p>
							<p className="text-foreground font-semibold">{log.condition}</p>
							{log.treatment ? <p className="text-muted-foreground mt-0.5 text-sm">{log.treatment}</p> : null}
						</li>
					))}
				</ul>

				<DialogFooter className="gap-2">
					<Button variant="ghost" onClick={onCancel} disabled={isPending} className="h-11 rounded-xl">
						Not now
					</Button>
					<Button onClick={onAcknowledge} disabled={isPending} className="h-11 rounded-xl font-semibold">
						{isPending ? "Checking in…" : `Check ${first} in`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
