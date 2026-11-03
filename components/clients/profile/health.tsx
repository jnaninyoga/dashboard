"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";

import { DocumentSection } from "@/components/b2b/documents/document-section";
import { FormSheet } from "@/components/form-sheet";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addHealthNote, reopenHealthNote, resolveHealthNote } from "@/lib/actions/clients/health";
import { HEALTH_TEMPLATE } from "@/lib/config/health";
import { shortDay } from "@/lib/domain/clients/card";
import { healthPicture } from "@/lib/domain/clients/health";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { studioDateString } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";
import { healthNoteSchema,type HealthNoteValues } from "@/lib/validators/health-note";
import { type HealthLog } from "@/services/database/schema";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown2, ArrowRotateLeft, HeartAdd, TickCircle } from "iconsax-reactjs";

const AREA = { physical: "Body", mental: "Mind", lifestyle: "Lifestyle" } as const;
const WEIGHT = { info: "Good to know", warning: "Warning", critical: "Critical" } as const;

/** Two to four choices as one row of pills (a radio group underneath). */
function Choice<T extends string>({
	name,
	value,
	onChange,
	options,
	label,
}: {
	name: string;
	value: T;
	onChange: (value: T) => void;
	options: readonly (readonly [T, string])[];
	label: string;
}) {
	return (
		<div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-secondary/40 p-1">
			{options.map(([option, text]) => (
				<label
					key={option}
					className="flex min-h-10 cursor-pointer items-center justify-center rounded-xl px-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground has-checked:bg-card has-checked:text-foreground has-checked:shadow-sm has-focus-visible:ring-2 has-focus-visible:ring-ring"
				>
					<input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} className="sr-only" />
					{text}
				</label>
			))}
		</div>
	);
}

const blank = (): HealthNoteValues => ({
	category: "physical",
	severity: "info",
	condition: "",
	treatment: "",
	startDate: studioDateString(),
});

function AddNoteSheet({ clientId }: { clientId: string }) {
	const formId = useId();
	const [open, setOpen] = useState(false);
	const [pending, startTransition] = useTransition();
	const form = useForm<HealthNoteValues>({ resolver: zodResolver(healthNoteSchema), defaultValues: blank() });
	const severity = useWatch({ control: form.control, name: "severity" });

	useEffect(() => {
		if (open) form.reset(blank());
	}, [open, form]);

	const onSubmit = (values: HealthNoteValues) =>
		startTransition(async () => {
			const result = await addHealthNote(clientId, values);
			if (result.success) {
				notify.success("Note added", values.severity === "info" ? undefined : "It shows at check-in.");
				setOpen(false);
			} else {
				notifyActionError(result, "Couldn't add the note");
			}
		});

	return (
		<FormSheet
			open={open}
			onOpenChange={setOpen}
			busy={pending}
			dirty={form.formState.isDirty}
			trigger={
				<Button variant="outline" className="h-10 rounded-xl px-4 font-semibold">
					<HeartAdd className="mr-2 size-5" variant="Bulk" />
					Add a note
				</Button>
			}
			icon={<HeartAdd size={28} variant="Bulk" />}
			title="New health note"
			description="What she should know before class: an injury, a condition, a treatment."
			footer={
				<Button type="submit" form={formId} disabled={pending} className="h-11 rounded-xl font-semibold">
					{pending ? "Saving…" : "Add note"}
				</Button>
			}
		>
			<Form {...form}>
				<form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-2">
					<FormField
						control={form.control}
						name="category"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Where</FormLabel>
								<Choice name={field.name} label="Where" value={field.value} onChange={field.onChange} options={Object.entries(AREA) as [keyof typeof AREA, string][]} />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="severity"
						render={({ field }) => (
							<FormItem>
								<FormLabel>How much it matters</FormLabel>
								<Choice name={field.name} label="How much it matters" value={field.value} onChange={field.onChange} options={Object.entries(WEIGHT) as [keyof typeof WEIGHT, string][]} />
								<p className="text-sm text-muted-foreground">
									{severity === "info" ? "Kept on their page." : "Shown as an alert before they're checked in."}
								</p>
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="condition"
						render={({ field }) => (
							<FormItem>
								<FormLabel>What it is</FormLabel>
								<FormControl>
									<Input placeholder="Lower back pain" autoComplete="off" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="treatment"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Care or treatment <span className="font-normal text-muted-foreground">(optional)</span>
								</FormLabel>
								<FormControl>
									<Textarea rows={3} placeholder="Avoid deep forward bends; physiotherapy twice a week" {...field} value={field.value ?? ""} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="startDate"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Since</FormLabel>
								<FormControl>
									<Input type="date" max={studioDateString()} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</form>
			</Form>
		</FormSheet>
	);
}

/** A disclosure under the notes: its rows show once she opens it. */
function Fold({ label, children }: { label: string; children: React.ReactNode }) {
	const [open, setOpen] = useState(false);
	return (
		<div className="border-t">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				aria-expanded={open}
				className="flex min-h-12 w-full items-center justify-between gap-3 px-5 text-left text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
			>
				{label}
				<ArrowDown2 size={16} className={cn("transition-transform motion-reduce:transition-none", open && "rotate-180")} />
			</button>
			{open ? children : null}
		</div>
	);
}

/**
 * The client's health, as she reads it before class: alerts first (they
 * also show at check-in), then notes, each with its care and since when;
 * what's been resolved and the intake form's answers fold away below.
 */
export function HealthSection({ clientId, notes, intake }: { clientId: string; notes: HealthLog[]; intake: Record<string, string> }) {
	const today = studioDateString();
	const picture = healthPicture(notes);
	const open = [...picture.alerts, ...picture.notes];
	const [busy, setBusy] = useState<string | null>(null);
	const answered = HEALTH_TEMPLATE.map((section) => ({ ...section, fields: section.fields.filter((field) => intake[field.key]) })).filter(
		(section) => section.fields.length,
	);
	const answers = answered.reduce((sum, section) => sum + section.fields.length, 0);

	const act = async (note: HealthLog, action: "resolve" | "reopen") => {
		setBusy(note.id);
		const result = await (action === "resolve" ? resolveHealthNote(note.id) : reopenHealthNote(note.id));
		setBusy(null);
		if (result.success) notify.success(action === "resolve" ? `Resolved: ${note.condition}` : `Reopened: ${note.condition}`, action === "resolve" ? "It stays in their history." : undefined);
		else notifyActionError(result, action === "resolve" ? "Couldn't resolve the note" : "Couldn't reopen the note");
	};

	return (
		<DocumentSection id="health" title="Health" aside={<AddNoteSheet clientId={clientId} />} className="scroll-mt-20">
			<div className="overflow-hidden rounded-2xl border bg-card">
				{open.length ? (
					<ul className="divide-y divide-border">
						{open.map((note) => (
							<li key={note.id} className="flex items-start gap-3 px-5 py-4">
								<span
									aria-hidden
									className={cn(
										"mt-1 w-1 self-stretch rounded-full",
										note.isAlert ? (note.severity === "critical" ? "bg-destructive" : "bg-warning") : "bg-muted-foreground/25",
									)}
								/>
								<div className="min-w-0 flex-1">
									<p className="text-sm text-muted-foreground">
										{AREA[note.category]}
										{note.isAlert ? (
											<span className={cn("font-medium", note.severity === "critical" ? "text-destructive" : "text-warning")}>
												{`, ${WEIGHT[note.severity].toLowerCase()}`}
											</span>
										) : null}
										{`, since ${shortDay(note.startDate, today)}`}
									</p>
									<p className="font-semibold text-foreground">{note.condition}</p>
									{note.treatment ? <p className="mt-0.5 text-sm text-muted-foreground">{note.treatment}</p> : null}
								</div>
								<Button
									variant="ghost"
									size="sm"
									disabled={busy !== null}
									onClick={() => act(note, "resolve")}
									aria-label={`Mark ${note.condition} resolved`}
									className="-mr-2 h-9 shrink-0 rounded-lg text-muted-foreground hover:text-success"
								>
									<TickCircle size={18} />
									<span className="max-sm:sr-only">Resolve</span>
								</Button>
							</li>
						))}
					</ul>
				) : (
					<p className="px-5 py-6 text-center text-sm text-muted-foreground">
						No health notes. Add what she should know before class.
					</p>
				)}

				{picture.resolved.length ? (
					<Fold label={`Resolved (${picture.resolved.length})`}>
						<ul className="divide-y divide-border border-t bg-muted/30">
							{picture.resolved.map((note) => (
								<li key={note.id} className="flex items-center gap-3 px-5 py-3">
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium text-muted-foreground line-through decoration-muted-foreground/40">{note.condition}</p>
										<p className="text-sm text-muted-foreground">
											{AREA[note.category]}, {shortDay(note.startDate, today)}
											{note.endDate ? ` to ${shortDay(note.endDate, today)}` : ""}
										</p>
									</div>
									<Button
										variant="ghost"
										size="sm"
										disabled={busy !== null}
										onClick={() => act(note, "reopen")}
										aria-label={`Reopen ${note.condition}`}
										className="-mr-2 h-9 shrink-0 rounded-lg text-muted-foreground"
									>
										<ArrowRotateLeft size={16} />
										<span className="max-sm:sr-only">Reopen</span>
									</Button>
								</li>
							))}
						</ul>
					</Fold>
				) : null}

				{answers ? (
					<Fold label={`From the intake form (${answers} ${answers === 1 ? "answer" : "answers"})`}>
						<div className="grid gap-5 border-t bg-muted/30 px-5 py-4">
							{answered.map((section) => (
								<div key={section.category} className="grid gap-2">
									<h3 className="text-sm font-semibold text-foreground">{section.label}</h3>
									<dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
										{section.fields.map((field) => (
											<div key={field.key} className="min-w-0">
												<dt className="text-sm text-muted-foreground">{field.label}</dt>
												<dd className="text-sm font-medium wrap-break-word text-foreground">{intake[field.key]}</dd>
											</div>
										))}
									</dl>
								</div>
							))}
						</div>
					</Fold>
				) : null}
			</div>
		</DocumentSection>
	);
}
