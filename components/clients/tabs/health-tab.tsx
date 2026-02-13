
"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
	AlertTriangle,
	Plus,
	History,
	Info,
	CheckCircle,
	XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { addHealthLog, toggleHealthAlert } from "@/actions/health";
import { HealthCategory, HealthSeverity } from "@/lib/types/health";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface HealthTabProps {
	clientId: string;
	healthLogs: any[]; // TODO: Type properly from DB schema
}

export function HealthTab({ clientId, healthLogs }: HealthTabProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();

	// Form State
	const [category, setCategory] = useState<HealthCategory>(
		HealthCategory.PHYSICAL,
	);
	const [severity, setSeverity] = useState<HealthSeverity>(HealthSeverity.INFO);
	const [condition, setCondition] = useState("");
	const [startDate, setStartDate] = useState(
		new Date().toISOString().split("T")[0],
	);

	const activeAlerts = healthLogs.filter((log) => log.isAlert);
	const historyLogs = healthLogs; // Show all in history, or filter out alerts? 
    // Requirement: "Health History. A chronological list of all logs."

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const result = await addHealthLog(clientId, {
				category,
				severity,
				condition,
				startDate,
			});

			if (result.success) {
				setIsOpen(false);
				setCondition("");
				setSeverity(HealthSeverity.INFO);
                // Router refresh handled by action revalidatePath, but client needs to refresh view? 
                // revalidatePath refreshes server data, but client router cache might hold old data?
                // Usually Server Actions + revalidatePath updates the UI automatically if using standard navigation.
			} else {
				console.error(result.error);
				alert("Failed to add log");
			}
		} catch (error) {
			console.error(error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleToggleAlert = async (logId: string, currentStatus: boolean) => {
		// Optimistic update could be done here, but sticking to simple async for now
		await toggleHealthAlert(logId, !currentStatus);
	};

	return (
		<div className="space-y-6">
			{/* Active Alerts Section */}
			{activeAlerts.length > 0 && (
				<Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
					<CardHeader className="pb-2">
						<CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
							<AlertTriangle className="h-5 w-5" />
							Active Health Alerts
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{activeAlerts.map((log) => (
								<div
									key={log.id}
									className="flex items-start justify-between bg-white dark:bg-background p-3 rounded-md border border-red-100 dark:border-red-900/20 shadow-sm"
								>
									<div>
										<div className="flex items-center gap-2 mb-1">
											<Badge
												variant={
													log.severity === "critical" ? "destructive" : "default"
												}
												className={cn(
													log.severity === "warning" &&
														"bg-yellow-500 hover:bg-yellow-600 text-white",
												)}
											>
												{log.severity}
											</Badge>
											<span className="font-medium">{log.condition}</span>
										</div>
										<p className="text-sm text-muted-foreground">
											From: {format(new Date(log.startDate), "PPP")}
										</p>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleToggleAlert(log.id, log.isAlert)}
										title="Dismiss Alert"
									>
										<CheckCircle className="h-4 w-4 text-green-600" />
										<span className="sr-only">Dismiss</span>
									</Button>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			<div className="flex justify-end">
				<Dialog open={isOpen} onOpenChange={setIsOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							New Health Log
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Add Health Log</DialogTitle>
						</DialogHeader>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label>Category</Label>
								<Select
									value={category}
									onValueChange={(v) => setCategory(v as HealthCategory)}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={HealthCategory.PHYSICAL}>
											Physical (Body)
										</SelectItem>
										<SelectItem value={HealthCategory.MENTAL}>
											Mental (Mind)
										</SelectItem>
										<SelectItem value={HealthCategory.LIFESTYLE}>
											Lifestyle
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Condition / Issue</Label>
								<Input
									placeholder="e.g., Lower back pain, Stress..."
									value={condition}
									onChange={(e) => setCondition(e.target.value)}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label>Severity</Label>
								<Select
									value={severity}
									onValueChange={(v) => setSeverity(v as HealthSeverity)}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={HealthSeverity.INFO}>Info</SelectItem>
										<SelectItem value={HealthSeverity.WARNING}>
											Warning (Alert)
										</SelectItem>
										<SelectItem value={HealthSeverity.CRITICAL}>
											Critical (Alert)
										</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground">
									Warning and Critical items trigger an active alert.
								</p>
							</div>

							<div className="space-y-2">
								<Label>Start Date</Label>
								<Input
									type="date"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
									required
								/>
							</div>

							<DialogFooter>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? "Saving..." : "Save Log"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg flex items-center gap-2">
						<History className="h-5 w-5" />
						Health Changes Log
					</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Historical record of all health events. Manage active conditions via "Edit Profile".
                    </p>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{healthLogs.length === 0 ? (
							<p className="text-muted-foreground text-sm italic">
								No health logs recorded.
							</p>
						) : (
							healthLogs.map((log) => (
								<div
									key={log.id}
									className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 last:border-0 last:pb-0 gap-2"
								>
									<div className="flex items-start gap-3">
										<div className="mt-1">
											{log.severity === "info" && (
												<Info className="h-4 w-4 text-blue-500" />
											)}
											{log.severity === "warning" && (
												<AlertTriangle className="h-4 w-4 text-yellow-500" />
											)}
											{log.severity === "critical" && (
												<XCircle className="h-4 w-4 text-red-500" />
											)}
										</div>
										<div>
											<p className="font-medium text-sm">{log.condition}</p>
											<div className="flex items-center gap-2 text-xs text-muted-foreground">
												<span className="capitalize">{log.category}</span>
												<span>•</span>
												<span>{format(new Date(log.startDate), "PPP")}</span>
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2">
                                        {!log.isAlert && (log.severity === 'warning' || log.severity === 'critical') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => handleToggleAlert(log.id, true)}
                                            >
                                                Re-activate
                                            </Button>
                                        )}
                                    </div>
								</div>
							))
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
