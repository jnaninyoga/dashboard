"use client";

import { AlertTriangle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function HealthGuardrailDialog({
	isOpen,
	clientData,
	onAcknowledge,
	onCancel,
	isPending,
}: {
	isOpen: boolean;
	clientData: any;
	onAcknowledge: () => void;
	onCancel: () => void;
	isPending: boolean;
}) {
	if (!clientData) return null;

	const alerts = (clientData.healthLogs || []).filter((log: any) => log.isAlert);

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onCancel()}>
			<DialogContent className="sm:max-w-md rounded-3xl zen-shadow-lg border-0 bg-card p-0 overflow-hidden max-h-[90vh]">
				{/* Red top accent bar */}
				<div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-orange-400 rounded-t-3xl" />
				
				<div className="px-6 pt-5 pb-2">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-destructive text-xl font-heading font-bold">
							<div className="bg-red-100 p-2 rounded-full">
								<AlertTriangle className="h-5 w-5" />
							</div>
							Health Guardrails
						</DialogTitle>
						<DialogDescription className="text-base text-muted-foreground mt-3">
							Please review the active health conditions for <strong className="text-foreground">{clientData.fullName}</strong>.
						</DialogDescription>
					</DialogHeader>
				</div>

				<div className="flex flex-col gap-4 px-6 py-2 max-h-[50vh] overflow-y-auto">
					{alerts.length > 0 ? (
						alerts.map((log: any) => (
							<Alert key={log.id} variant="destructive" className="bg-red-50 border-0 rounded-2xl p-5 zen-shadow">
								<AlertTriangle className="h-5 w-5 text-red-600" />
								<AlertTitle className="capitalize text-red-800 font-bold ml-2">
                                    {log.category === 'physical' ? 'Body' : log.category === 'mental' ? 'Mind' : 'Lifestyle'} Issue - {log.severity}
                                </AlertTitle>
								<AlertDescription className="mt-2 ml-2 text-red-900 text-base">
									<div className="mb-1"><strong className="font-semibold">Condition:</strong> {log.condition}</div>
									{log.treatment && <div><strong className="font-semibold">Treatment/Notes:</strong> {log.treatment}</div>}
								</AlertDescription>
							</Alert>
						))
					) : (
						<Alert className="rounded-2xl border-0 bg-muted">
							<Info className="h-4 w-4" />
							<AlertTitle>No Active Alerts</AlertTitle>
							<AlertDescription>This client has no active health alerts.</AlertDescription>
						</Alert>
					)}
				</div>

				<DialogFooter className="sm:justify-between flex-row gap-3 p-6 pt-4">
					<Button variant="outline" onClick={onCancel} disabled={isPending} className="flex-1 min-h-[56px] text-base font-semibold rounded-2xl border-0 bg-muted hover:bg-muted/80">
						Cancel
					</Button>
					<Button 
						variant="destructive" 
						onClick={onAcknowledge} 
						disabled={isPending}
						className="flex-1 min-h-[56px] text-base font-bold rounded-2xl zen-shadow"
					>
						{isPending ? "Checking in..." : "Acknowledge & Check-in"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
