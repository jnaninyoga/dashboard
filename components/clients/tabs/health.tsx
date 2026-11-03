"use client";

import { useId, useState } from "react";

import { FormSheet } from "@/components/form-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { addHealthLog, toggleHealthAlert } from "@/lib/actions/clients/health";
import { HEALTH_TEMPLATE } from "@/lib/config/health";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { HealthCategory, HealthSeverity } from "@/lib/types/health";
import { toStudioTime } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";
import { type Client, type HealthLog } from "@/services/database/schema";

import { format } from "date-fns";
import {
	Add,
	CloseCircle,
	Danger,
	Health,
	HeartAdd,
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
	const formId = useId();
	const [isOpen, setIsOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Form State
	const today = () => format(toStudioTime(), "yyyy-MM-dd");
	const [category, setCategory] = useState<HealthCategory>(
		HealthCategory.PHYSICAL,
	);
	const [severity, setSeverity] = useState<HealthSeverity>(HealthSeverity.INFO);
	const [condition, setCondition] = useState("");
	const [startDate, setStartDate] = useState(today);

	// Every open starts from a blank note.
	const openForm = (open: boolean) => {
		if (open) {
			setCategory(HealthCategory.PHYSICAL);
			setSeverity(HealthSeverity.INFO);
			setCondition("");
			setStartDate(today());
		}
		setIsOpen(open);
	};
	const isDirty =
		condition.trim() !== "" ||
		category !== HealthCategory.PHYSICAL ||
		severity !== HealthSeverity.INFO ||
		startDate !== today();

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
				notify.success("Health note added");
			} else {
				notifyActionError(result, "Couldn't add this health note");
			}
		} catch (error) {
			notify.error("Couldn't add this health note", { error });
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
				<Card className="border-none border-secondary/30 shadow-sm">
					<CardHeader className="pb-4">
						<CardTitle className="flex items-center gap-2 text-lg text-secondary-foreground">
							<Health className="size-5" variant="Bulk" />
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
												"hover:zen-glow-blush border-destructive/25 bg-destructive/5 hover:bg-destructive/10",
											isWarning &&
												"hover:zen-glow-teal border-warning/25 bg-warning/5 hover:bg-warning/10",
											isInfo &&
												"hover:zen-glow-teal border-info/25 bg-info/5 hover:bg-info/10",
										)}
									>
										<div className="flex items-center gap-4">
											<div
												className={cn(
													"flex size-12 shrink-0 items-center justify-center rounded-xl",
													isCritical && "bg-destructive/70 text-destructive",
													isWarning && "bg-warning/70 text-warning",
													isInfo && "bg-info/70 text-info",
												)}
											>
												{isCritical || isWarning ? (
													<Danger className="size-6" variant="Bold" />
												) : (
													<InfoCircle className="size-6" variant="Bold" />
												)}
											</div>
											<div className="flex flex-col gap-2">
												<div className="flex items-center gap-2">
													<Badge
														className={cn(
															"text-[10px] font-bold tracking-wider uppercase",
															isCritical && "bg-destructive text-destructive-foreground",
															isWarning && "bg-warning text-warning-foreground",
															isInfo && "bg-info text-info-foreground",
														)}
													>
														{log.severity}
													</Badge>
													<span className="text-[10px] font-bold tracking-wider text-secondary-foreground uppercase opacity-40">
														From {format(new Date(log.startDate), "MMMM d")}
													</span>
												</div>
												<span
													className={cn(
														"text-lg leading-tight font-bold",
														isCritical && "text-destructive",
														isWarning && "text-warning",
														isInfo && "text-info",
													)}
												>
													{log.condition}
												</span>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<span className="hidden text-[10px] font-bold tracking-wider text-success uppercase opacity-0 transition-opacity group-hover:opacity-100 sm:inline">
												Resolve
											</span>
											<Checkbox
												checked={false}
												onCheckedChange={() =>
													handleToggleAlert(log.id, log.isAlert)
												}
												className="size-8 rounded-xl border-2 border-success/20 bg-card transition-all hover:border-success active:scale-90 data-[state=checked]:border-success data-[state=checked]:bg-success"
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
					<CardTitle className="flex items-center gap-2 text-lg font-bold text-primary">
						<InfoCircle className="size-5" variant="Bulk" />
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
									<div className="h-1 w-8 rounded-full bg-secondary-2" />
									<h4 className="text-xs font-bold tracking-wider text-secondary-foreground uppercase opacity-40">
										{section.label}
									</h4>
								</div>
								<div className="grid gap-3 sm:grid-cols-2">
									{section.fields.map((field) => {
										if (!intakeData[field.key]) return null;
										return (
											<div
												key={field.key}
												className="group hover:zen-glow-teal flex flex-col gap-1 rounded-2xl border border-transparent bg-muted/30 p-3 transition-all hover:border-primary/10 hover:bg-card sm:col-span-1"
											>
												<span className="text-[10px] font-bold tracking-wider text-secondary-foreground uppercase opacity-60">
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
						<div className="rounded-3xl border border-dashed bg-muted/20 py-8 text-center">
							<p className="text-sm text-muted-foreground italic">
								No foundational health data recorded yet.
							</p>
						</div>
					) : null}
				</CardContent>
			</Card>

			<div className="flex justify-end">
				<FormSheet
					open={isOpen}
					onOpenChange={openForm}
					busy={isSubmitting}
					dirty={isDirty}
					trigger={
						<Button className="zen-glow-teal h-12 rounded-2xl px-6 font-bold transition-all active:scale-95">
							<Add className="mr-2 size-5" variant="Bold" />
							New Health Entry
						</Button>
					}
					icon={<HeartAdd size={28} variant="Bulk" />}
					title="New health note"
					description="Warnings and critical notes show as alerts at check-in."
					footer={
						<Button
							type="submit"
							form={formId}
							disabled={isSubmitting}
							className="h-11 rounded-xl font-bold"
						>
							{isSubmitting ? "Saving…" : "Save note"}
						</Button>
					}
				>
					<form id={formId} onSubmit={handleSubmit} className="space-y-6 py-2">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label className="text-xs font-bold tracking-wider uppercase opacity-60">
								Category
							</Label>
							<Select
								value={category}
								onValueChange={(v) => setCategory(v as HealthCategory)}
							>
								<SelectTrigger className="h-11 rounded-xl border">
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
								<SelectTrigger className="h-11 rounded-xl border">
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
							className="h-11 rounded-xl border"
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
							className="h-11 rounded-xl border"
						/>
					</div>
					</form>
				</FormSheet>
			</div>

			<Card className="border-none shadow-sm">
				<CardHeader className="pb-4">
					<CardTitle className="flex items-center gap-2 text-lg font-bold text-primary">
						<Timer1 className="size-5" variant="Bulk" />
						Health Timeline
					</CardTitle>
					<p className="text-xs font-medium text-secondary-foreground opacity-50">
						Chronological record of physiological and wellness shifts.
					</p>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{healthLogs.length === 0 ? (
							<div className="py-6 text-center">
								<p className="text-sm text-muted-foreground italic">
									No historical records on file.
								</p>
							</div>
						) : (
							healthLogs.map((log) => (
								<div
									key={log.id}
									className="group hover:zen-glow-teal flex items-start justify-between gap-4 rounded-2xl border border-transparent bg-muted/20 p-4 transition-all hover:border-primary/10 hover:bg-card"
								>
									<div className="flex items-start gap-4">
										<div className="mt-1">
											{log.severity === "info" ? (
												<div className="flex size-10 items-center justify-center rounded-xl bg-info/10 text-info">
													<InfoCircle className="size-5" variant="Bold" />
												</div>
											) : null}
											{log.severity === "warning" ? (
												<div className="flex size-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
													<Danger className="size-5" variant="Bold" />
												</div>
											) : null}
											{log.severity === "critical" ? (
												<div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
													<CloseCircle className="size-5" variant="Bold" />
												</div>
											) : null}
										</div>
										<div className="flex flex-col">
											<div className="mb-0.5 flex items-center gap-2">
												<span className="text-[10px] font-bold tracking-wider text-secondary-foreground uppercase opacity-60">
													{log.category}
												</span>
												<span className="text-muted-foreground/30">•</span>
												<span className="text-[10px] font-bold tracking-wider text-secondary-foreground uppercase opacity-40">
													{format(new Date(log.startDate), "PP")}
												</span>
											</div>
											<span className="text-base leading-tight font-bold text-secondary-foreground">
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
												className="h-8 rounded-xl text-[10px] font-bold tracking-wider uppercase hover:bg-secondary/40"
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
