"use client";

import { useState } from "react";

import { addHealthLog, toggleHealthAlert } from "@/actions/clients/health";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
	Add,
	CloseCircle,
	Danger,
	Health,
	InfoCircle,
	Timer1,
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
		<div className="mx-auto max-w-3xl space-y-8">
			{/* Active Alerts Section */}
			{activeAlerts.length > 0 ? (
				<Card className="border-secondary/30 border-none shadow-sm">
					<CardHeader className="pb-4">
						<CardTitle className="text-secondary-2 flex items-center gap-2 text-lg">
							<Health className="h-5 w-5" variant="Bulk" />
							Active Health Alerts
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{activeAlerts.map((log) => {
								const isCritical = log.severity === "critical";
								const isWarning = log.severity === "warning";
								const isInfo = log.severity === "info";

								return (
									<div
										key={log.id}
										className={cn(
											"group flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all active:scale-[0.98]",
											isCritical &&
												"hover:zen-glow-blush border-red-200 bg-red-100/40 hover:bg-red-100",
											isWarning &&
												"hover:zen-glow-teal border-yellow-200 bg-yellow-100/40 hover:bg-yellow-100",
											isInfo &&
												"hover:zen-glow-teal border-blue-200 bg-blue-100/40 hover:bg-blue-100",
										)}
									>
										<div className="flex items-center gap-4">
											<div
												className={cn(
													"flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
													isCritical && "bg-red-300 text-red-600",
													isWarning && "bg-yellow-300 text-yellow-600",
													isInfo && "bg-blue-300 text-blue-600",
												)}
											>
												{isCritical || isWarning ? (
													<Danger className="h-6 w-6" variant="Bold" />
												) : (
													<InfoCircle className="h-6 w-6" variant="Bold" />
												)}
											</div>
											<div className="flex flex-col gap-2">
												<div className="flex items-center gap-2">
													<Badge
														className={cn(
															"text-[10px] font-bold tracking-wider uppercase",
															isCritical && "bg-red-600 text-white",
															isWarning && "bg-yellow-600 text-white",
															isInfo && "bg-blue-600 text-white",
														)}
													>
														{log.severity}
													</Badge>
													<span className="text-secondary-foreground text-[10px] font-bold tracking-wider uppercase opacity-40">
														From {format(new Date(log.startDate), "MMMM d")}
													</span>
												</div>
												<span
													className={cn(
														"text-lg leading-tight font-bold",
														isCritical && "text-red-900",
														isWarning && "text-yellow-900",
														isInfo && "text-blue-900",
													)}
												>
													{log.condition}
												</span>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<span className="hidden text-[10px] font-bold tracking-wider text-green-600 uppercase opacity-0 transition-opacity group-hover:opacity-100 sm:inline">
												Resolve
											</span>
											<Checkbox
												checked={false}
												onCheckedChange={() =>
													handleToggleAlert(log.id, log.isAlert)
												}
												className="size-8 rounded-xl border-2 border-green-600/20 bg-card transition-all hover:border-green-600 active:scale-90 data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600"
												title="Mark as Resolved"
											/>
										</div>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			) : null}

			{/* Static Health & Wellness Profile */}
			<Card className="border-none shadow-sm">
				<CardHeader className="pb-4">
					<CardTitle className="text-primary flex items-center gap-2 text-lg font-bold">
						<InfoCircle className="h-5 w-5" variant="Bulk" />
						Health & Wellness Profile
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-8">
					{HEALTH_TEMPLATE.map((section) => {
						const hasData = section.fields.some((f) => intakeData[f.key]);
						if (!hasData) return null;

						return (
							<div key={section.category}>
								<div className="mb-4 flex items-center gap-2">
									<div className="bg-secondary-2 h-1 w-8 rounded-full" />
									<h4 className="text-secondary-foreground text-xs font-bold tracking-wider uppercase opacity-40">
										{section.label}
									</h4>
								</div>
								<div className="grid gap-3 sm:grid-cols-2">
									{section.fields.map((field) => {
										if (!intakeData[field.key]) return null;
										return (
											<div
												key={field.key}
												className="group bg-muted/30 hover:border-primary/10 hover:zen-glow-teal flex flex-col gap-1 rounded-2xl border border-transparent p-3 transition-all hover:bg-card sm:col-span-1"
											>
												<span className="text-secondary-foreground text-[10px] font-bold tracking-wider uppercase opacity-60">
													{field.label}
												</span>
												<span className="text-sm leading-tight font-semibold">
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
						<div className="bg-muted/20 border rounded-3xl border border-dashed py-8 text-center">
							<p className="text-muted-foreground text-sm italic">
								No foundational health data recorded yet.
							</p>
						</div>
					) : null}
				</CardContent>
			</Card>

			<div className="flex justify-end">
				<Dialog open={isOpen} onOpenChange={setIsOpen}>
					<DialogTrigger asChild>
						<Button className="zen-glow-teal h-12 rounded-2xl px-6 font-bold transition-all active:scale-95">
							<Add className="mr-2 h-5 w-5" variant="Bold" />
							New Health Entry
						</Button>
					</DialogTrigger>
					<DialogContent className="rounded-3xl p-6">
						<DialogHeader>
							<DialogTitle className="text-2xl font-bold">
								Record Health Log
							</DialogTitle>
						</DialogHeader>
						<form onSubmit={handleSubmit} className="space-y-6 pt-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label className="text-xs font-bold tracking-wider uppercase opacity-60">
										Category
									</Label>
									<Select
										value={category}
										onValueChange={(v) => setCategory(v as HealthCategory)}
									>
										<SelectTrigger className="border h-11 rounded-xl">
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
									<Label className="text-xs font-bold tracking-wider uppercase opacity-60">
										Severity
									</Label>
									<Select
										value={severity}
										onValueChange={(v) => setSeverity(v as HealthSeverity)}
									>
										<SelectTrigger className="border h-11 rounded-xl">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value={HealthSeverity.INFO}>
												General Info
											</SelectItem>
											<SelectItem value={HealthSeverity.WARNING}>
												Warning (Alert)
											</SelectItem>
											<SelectItem value={HealthSeverity.CRITICAL}>
												Critical (Level 1)
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label className="text-xs font-bold tracking-wider uppercase opacity-60">
									Condition / Note
								</Label>
								<Input
									placeholder="e.g., Lower back pain, Stress levels high..."
									value={condition}
									onChange={(e) => setCondition(e.target.value)}
									required
									className="border h-11 rounded-xl"
								/>
							</div>

							<div className="space-y-2">
								<Label className="text-xs font-bold tracking-wider uppercase opacity-60">
									Effective Date
								</Label>
								<Input
									type="date"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
									required
									className="border h-11 rounded-xl"
								/>
							</div>

							<DialogFooter>
								<Button
									type="submit"
									disabled={isSubmitting}
									className="h-12 w-full rounded-2xl font-bold"
								>
									{isSubmitting ? "Syncing..." : "Commit Log Entry"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<Card className="border-none shadow-sm">
				<CardHeader className="pb-4">
					<CardTitle className="text-primary flex items-center gap-2 text-lg font-bold">
						<Timer1 className="h-5 w-5" variant="Bulk" />
						Health Timeline
					</CardTitle>
					<p className="text-secondary-foreground text-xs font-medium opacity-50">
						Chronological record of physiological and wellness shifts.
					</p>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{healthLogs.length === 0 ? (
							<div className="py-6 text-center">
								<p className="text-muted-foreground text-sm italic">
									No historical records on file.
								</p>
							</div>
						) : (
							healthLogs.map((log) => (
								<div
									key={log.id}
									className="group bg-muted/20 hover:border-primary/10 hover:zen-glow-teal flex items-start justify-between gap-4 rounded-2xl border border-transparent p-4 transition-all hover:bg-card"
								>
									<div className="flex items-start gap-4">
										<div className="mt-1">
											{log.severity === "info" ? (
												<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
													<InfoCircle className="h-5 w-5" variant="Bold" />
												</div>
											) : null}
											{log.severity === "warning" ? (
												<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
													<Danger className="h-5 w-5" variant="Bold" />
												</div>
											) : null}
											{log.severity === "critical" ? (
												<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
													<CloseCircle className="h-5 w-5" variant="Bold" />
												</div>
											) : null}
										</div>
										<div className="flex flex-col">
											<div className="mb-0.5 flex items-center gap-2">
												<span className="text-secondary-foreground text-[10px] font-bold tracking-wider uppercase opacity-60">
													{log.category}
												</span>
												<span className="text-muted-foreground/30">•</span>
												<span className="text-secondary-foreground text-[10px] font-bold tracking-wider uppercase opacity-40">
													{format(new Date(log.startDate), "PP")}
												</span>
											</div>
											<span className="text-secondary-foreground text-base leading-tight font-bold">
												{log.condition}
											</span>
										</div>
									</div>
									<div className="flex items-center gap-2">
										{!log.isAlert &&
										(log.severity === "warning" ||
											log.severity === "critical") ? (
											<Button
												variant="outline"
												size="sm"
												className="hover:bg-secondary/40 h-8 rounded-xl text-[10px] font-bold tracking-wider uppercase"
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
