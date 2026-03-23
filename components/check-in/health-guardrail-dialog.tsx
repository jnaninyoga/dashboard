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
			<DialogContent className="sm:max-w-md border-red-500 max-h-[90vh]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-red-600 text-xl font-bold">
						<AlertTriangle className="h-6 w-6" />
						Health Guardrails
					</DialogTitle>
					<DialogDescription className="text-base text-gray-700 mt-2">
						Please review the active health conditions for <strong className="text-black">{clientData.fullName}</strong>.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 my-2 max-h-[50vh] overflow-y-auto pr-2">
					{alerts.length > 0 ? (
						alerts.map((log: any) => (
							<Alert key={log.id} variant="destructive" className="bg-red-50 border-red-200">
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
						<Alert>
							<Info className="h-4 w-4" />
							<AlertTitle>No Active Alerts</AlertTitle>
							<AlertDescription>This client has no active health alerts.</AlertDescription>
						</Alert>
					)}
				</div>

				<DialogFooter className="sm:justify-between flex-row gap-4 mt-4">
					<Button variant="outline" onClick={onCancel} disabled={isPending} className="flex-1 h-12 text-base">
						Cancel
					</Button>
					<Button 
						variant="destructive" 
						onClick={onAcknowledge} 
						disabled={isPending}
						className="flex-1 h-12 text-base font-bold bg-red-600 hover:bg-red-700"
					>
						{isPending ? "Checking in..." : "Acknowledge & Check-in"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
