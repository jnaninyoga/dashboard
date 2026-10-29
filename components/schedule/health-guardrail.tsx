"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type Client, type HealthLog } from "@/services/database/schema";

import { Danger, InfoCircle } from "iconsax-reactjs";

export function HealthGuardrailDialog({
	isOpen,
	clientData,
	onAcknowledge,
	onCancel,
	isPending,
}: {
	isOpen: boolean;
	clientData: Client & { healthLogs?: HealthLog[] } | null;
	onAcknowledge: () => void;
	onCancel: () => void;
	isPending: boolean;
}) {
	if (!clientData) return null;

	const alerts = (clientData.healthLogs || []).filter((log) => log.isAlert);

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onCancel()}>
			<DialogContent className="zen-shadow-lg bg-card max-h-[90vh] overflow-hidden rounded-3xl border-0 p-0 sm:max-w-md">
				{/* Red top accent bar */}
				<div className="from-destructive to-warning h-1.5 w-full rounded-t-3xl bg-linear-to-r" />
				
				<div className="px-6 pt-5 pb-2">
					<DialogHeader>
						<DialogTitle className="text-destructive font-heading flex items-center gap-2 text-xl font-bold">
							<div className="bg-destructive/10 rounded-full p-2">
								<Danger className="h-5 w-5" variant="Bulk" />
							</div>
							Health Guardrails
						</DialogTitle>
						<DialogDescription className="text-muted-foreground mt-3 text-base">
							Please review the active health conditions for <strong className="text-foreground">{clientData.fullName}</strong>.
						</DialogDescription>
					</DialogHeader>
				</div>

				<div className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto px-6 py-2">
					{alerts.length > 0 ? (
						alerts.map((log) => (
							<Alert key={log.id} variant="destructive" className="zen-shadow bg-destructive/10 rounded-2xl border-0 p-5">
								<Danger className="text-destructive h-5 w-5" variant="Bulk" />
								<AlertTitle className="text-destructive ml-2 font-bold capitalize">
                                    {log.category === 'physical' ? 'Body' : log.category === 'mental' ? 'Mind' : 'Lifestyle'} Issue - {log.severity}
                                </AlertTitle>
								<AlertDescription className="text-destructive mt-2 ml-2 text-base">
									<div className="mb-1"><strong className="font-semibold">Condition:</strong> {log.condition}</div>
									{log.treatment ? (
                                        <div><strong className="font-semibold">Treatment/Notes:</strong> {log.treatment}</div>
                                    ) : null}
								</AlertDescription>
							</Alert>
						))
					) : (
						<Alert className="bg-muted rounded-2xl border-0">
							<InfoCircle className="h-4 w-4" variant="Outline" />
							<AlertTitle>No Active Alerts</AlertTitle>
							<AlertDescription>This client has no active health alerts.</AlertDescription>
						</Alert>
					)}
				</div>

				<DialogFooter className="flex-row gap-3 p-6 pt-4 sm:justify-between">
					<Button variant="outline" onClick={onCancel} disabled={isPending} className="bg-muted hover:bg-muted/80 min-h-[56px] flex-1 rounded-2xl border-0 text-base font-semibold">
						Cancel
					</Button>
					<Button 
						variant="destructive" 
						onClick={onAcknowledge} 
						disabled={isPending}
						className="zen-shadow min-h-[56px] flex-1 rounded-2xl text-base font-bold"
					>
						{isPending ? "Checking in..." : "Acknowledge & Check-in"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
