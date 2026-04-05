"use client";

import { useState } from "react";

import { addHealthLog, toggleHealthAlert } from "@/actions/health";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { HEALTH_TEMPLATE } from "@/config/health";
import { type Client, type HealthLog } from "@/drizzle/schema";
import { HealthCategory, HealthSeverity } from "@/lib/types/health";
import { cn } from "@/lib/utils";

import { format } from "date-fns";
import {
	Add as Plus,
	CloseCircle as XCircle,
	Danger as AlertTriangle,
	InfoCircle as Info,
	TickCircle as CheckCircle,
	Timer1 as History,
} from "iconsax-reactjs";

type ClientWithLogs = Client & {
	healthLogs?: HealthLog[];
	intakeData?: unknown;
};

interface HealthTabProps {
	client: ClientWithLogs;
}

export function HealthTab({ client }: HealthTabProps) {
	const clientId = client.id;
	const healthLogs = (client.healthLogs as HealthLog[]) || [];
	const intakeData = (client.intakeData as Record<string, string>) || {};
	const [isOpen, setIsOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

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
		<div className="mx-auto max-w-3xl space-y-6">
			{/* Active Alerts Section */}
			{activeAlerts.length > 0 ? (
				<Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-lg text-red-600 dark:text-red-400">
							<AlertTriangle className="h-5 w-5" />
							Active Health Alerts
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{activeAlerts.map((log) => (
								<div
									key={log.id}
									className="dark:bg-background flex items-start justify-between rounded-md border border-red-100 bg-white p-3 shadow-sm dark:border-red-900/20"
								>
									<div>
										<div className="mb-1 flex items-center gap-2">
											<Badge
												variant={
													log.severity === "critical"
														? "destructive"
														: "default"
												}
												className={cn(
													log.severity === "warning" &&
														"bg-yellow-500 text-white hover:bg-yellow-600",
												)}
											>
												{log.severity}
											</Badge>
											<span className="font-medium">{log.condition}</span>
										</div>
										<p className="text-muted-foreground text-sm">
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
			) : null}

			{/* Static Health & Wellness Profile */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<Info className="h-5 w-5" />
						Health & Wellness Profile
					</CardTitle>
				</CardHeader>
				<CardContent>
					{HEALTH_TEMPLATE.map((section) => {
						const hasData = section.fields.some((f) => intakeData[f.key]);
						if (!hasData) return null;

						return (
							<div key={section.category} className="mb-6 last:mb-0">
								<h4 className="text-muted-foreground mb-3 border-b pb-1 text-sm font-semibold tracking-wider uppercase">
									{section.label}
								</h4>
								<div className="grid gap-2 text-sm">
									{section.fields.map((field) => {
										if (!intakeData[field.key]) return null;
										return (
											<div
												key={field.key}
												className="flex flex-col gap-1 py-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
											>
												<span className="min-w-[30%] font-medium whitespace-nowrap">
													{field.label}
												</span>
												<span className="text-muted-foreground text-left wrap-break-word sm:text-right">
													{intakeData[field.key]}
												</span>
											</div>
										);
									})}
								</div>
							</div>
						);
					})}

					{Object.keys(intakeData).length === 0 ? (
						<p className="text-muted-foreground text-sm italic">
							No health data recorded.
						</p>
					) : null}
				</CardContent>
			</Card>

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
								<p className="text-muted-foreground text-xs">
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
					<CardTitle className="flex items-center gap-2 text-lg">
						<History className="h-5 w-5" />
						Health Changes Log
					</CardTitle>
					<p className="text-muted-foreground mt-1 text-sm">
						Historical record of all health events. Manage active conditions via
						&quot;Edit Profile&quot;.
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
									className="flex flex-col justify-between gap-2 border-b pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center"
								>
									<div className="flex items-start gap-3">
										<div className="mt-1">
											{log.severity === "info" ? (
												<Info className="h-4 w-4 text-blue-500" />
											) : null}
											{log.severity === "warning" ? (
												<AlertTriangle className="h-4 w-4 text-yellow-500" />
											) : null}
											{log.severity === "critical" ? (
												<XCircle className="h-4 w-4 text-red-500" />
											) : null}
										</div>
										<div>
											<p className="text-sm font-medium">{log.condition}</p>
											<div className="text-muted-foreground flex items-center gap-2 text-xs">
												<span className="capitalize">{log.category}</span>
												<span>•</span>
												<span>{format(new Date(log.startDate), "PPP")}</span>
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2">
										{!log.isAlert &&
										(log.severity === "warning" ||
											log.severity === "critical") ? (
											<Button
												variant="outline"
												size="sm"
												className="h-7 text-xs"
												onClick={() => handleToggleAlert(log.id, true)}
											>
												Re-activate
											</Button>
										) : null}
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
