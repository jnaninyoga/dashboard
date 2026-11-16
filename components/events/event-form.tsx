"use client";

import { useId, useTransition } from "react";
import { type FieldPath, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { saveEventAction } from "@/lib/actions/events";
import { englishMissing, googleTranslateUrl } from "@/lib/domain/events/rules";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { notifyWebsite } from "@/lib/feedback/website";
import { CURRENCY } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/ui";
import { type EventFormInput, type EventFormValues, eventSchema } from "@/lib/validators/event";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Global, Location, Refresh, Translate, Warning2 } from "iconsax-reactjs";

type Field = FieldPath<EventFormInput>;

function TextField({ name, label, placeholder, description, type = "text", className }: { name: Field; label: string; placeholder?: string; description?: React.ReactNode; type?: string; className?: string }) {
	return (
		<FormField
			name={name}
			render={({ field }) => (
				<FormItem className={className}>
					<FormLabel>{label}</FormLabel>
					<FormControl>
						<Input type={type} placeholder={placeholder} {...field} value={String(field.value ?? "")} className="h-11" />
					</FormControl>
					{description ? <FormDescription>{description}</FormDescription> : null}
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

function LongField({ name, label, placeholder, rows = 6 }: { name: Field; label: string; placeholder?: string; rows?: number }) {
	return (
		<FormField
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel>{label}</FormLabel>
					<FormControl>
						<Textarea rows={rows} placeholder={placeholder} {...field} value={String(field.value ?? "")} />
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

/** A frame for one part of the form: a heading on the page, the fields in one container. */
function Part({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
	return (
		<section className="grid gap-3">
			<h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
				{icon}
				{title}
			</h2>
			<div className="grid gap-5 rounded-3xl border border-secondary/20 bg-card p-5 sm:p-6">{children}</div>
		</section>
	);
}

/**
 * Writes an outdoor event: in French, and in English for visitors who read
 * it (empty English shows the French, and Google Translate is a tap away);
 * when it starts and ends (it can last several days); where; its price; and
 * a limit on places, only if there is one.
 */
export function EventForm({ id, initial, status }: { id: string | null; initial: EventFormInput; status: "draft" | "published" | "cancelled" | null }) {
	const formId = useId();
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const form = useForm<EventFormInput, unknown, EventFormValues>({ resolver: zodResolver(eventSchema), defaultValues: initial });
	const watched = useWatch({ control: form.control });
	const missing = englishMissing({ titleEn: String(watched.titleEn ?? ""), descriptionEn: String(watched.descriptionEn ?? "") });
	const french = [watched.titleFr, watched.descriptionFr].filter(Boolean).join("\n\n");
	const published = status === "published";

	const submit = (publish: boolean) =>
		form.handleSubmit((values) =>
			startTransition(async () => {
				const result = await saveEventAction(id, values, publish);
				if (result.error) return void notifyActionError(result, "Couldn't save the event");
				notify.success(publish && !published ? "Published" : published ? "Saved" : "Draft saved");
				notifyWebsite(result.website);
				if (result.calendar === "failed") notify.warning("Not in your calendar yet", "Google didn't answer. Try again from the event's page.");
				form.reset(values as EventFormInput);
				if (!id && result.id) router.push(`/website/events/${result.id}`);
				else router.refresh();
			}),
		)();

	return (
		<Form {...form}>
			<form id={formId} onSubmit={(e) => e.preventDefault()} className="grid gap-8">
				<Part title="In French" icon={<Global size={20} variant="Bulk" className="text-primary" />}>
					<TextField name="titleFr" label="Title" placeholder="Lever de soleil à la Palmeraie" />
					<LongField name="descriptionFr" label="Description" placeholder="Ce que vous ferez, ce qu'il faut apporter, comment s'y rendre…" />
				</Part>

				<Part title="In English" icon={<Translate size={20} variant="Bulk" className="text-primary" />}>
					<TextField name="titleEn" label="Title" placeholder="Sunrise in the Palmeraie" />
					<LongField name="descriptionEn" label="Description" placeholder="What you'll do, what to bring, how to get there…" />
					{missing.title || missing.description ? (
						<div className="flex flex-wrap items-start gap-x-3 gap-y-2 rounded-2xl bg-warning/10 p-4 text-sm text-foreground" role="status">
							<Warning2 size={18} variant="Bold" className="mt-0.5 shrink-0 text-warning" />
							<p className="min-w-0 flex-1">
								{missing.title && missing.description ? "The English is empty" : missing.title ? "The English title is empty" : "The English description is empty"}: English
								visitors will see the French.
							</p>
							{french ? (
								<a
									href={googleTranslateUrl(french)}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex min-h-10 items-center gap-1.5 font-semibold text-primary hover:underline"
								>
									<Translate size={16} />
									Translate with Google
								</a>
							) : null}
						</div>
					) : null}
				</Part>

				<Part title="When and where" icon={<Calendar size={20} variant="Bulk" className="text-primary" />}>
					<div className="grid gap-4 sm:grid-cols-2">
						<TextField name="startDate" label="Starts on" type="date" />
						<TextField name="startTime" label="At" type="time" />
						<TextField name="endDate" label="Ends on" type="date" description="The same day for a morning; later for a retreat." />
						<TextField name="endTime" label="At" type="time" />
					</div>
					<TextField name="placeName" label="Place" placeholder="Palmeraie, near the Hivernage gate" />
					<TextField name="placeMapsUrl" label="Google Maps link (optional)" placeholder="https://maps.app.goo.gl/…" />
				</Part>

				<Part title="Price and places" icon={<Location size={20} variant="Bulk" className="text-primary" />}>
					<FormField
						name="price"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Price per person</FormLabel>
								<div className="relative">
									<FormControl>
										<Input inputMode="decimal" placeholder="250" {...field} value={String(field.value ?? "")} onChange={(e) => field.onChange(e.target.value.replace(/[^\d.,]/g, ""))} className="h-11 pr-14 tabular-nums" />
									</FormControl>
									<span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">{CURRENCY}</span>
								</div>
								<FormDescription>Paid to you, whether they have a card or not. 0 for a free event.</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="limited"
						render={({ field }) => (
							<FormItem className="flex items-center justify-between gap-4">
								<div className="grid gap-1">
									<FormLabel>Limited places</FormLabel>
									<FormDescription>The website shows the places left, then “Full”.</FormDescription>
								</div>
								<FormControl>
									<Switch checked={field.value === true} onCheckedChange={field.onChange} />
								</FormControl>
							</FormItem>
						)}
					/>
					{watched.limited ? (
						<FormField
							name="capacity"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Places</FormLabel>
									<FormControl>
										<Input inputMode="numeric" placeholder="12" {...field} value={String(field.value ?? "")} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))} className="h-11 w-32 tabular-nums" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					) : null}
				</Part>

				<div className={cn("sticky bottom-[calc(var(--bottom-bar,0px)+0.75rem)] z-10 flex flex-wrap gap-3 rounded-3xl border border-secondary/20 bg-background/90 p-3 backdrop-blur md:bottom-4")}>
					{status === "draft" || status === null ? (
						<>
							<Button type="button" disabled={pending} onClick={() => submit(true)} className="h-12 flex-1 rounded-2xl text-base font-semibold">
								{pending ? <Refresh className="mr-2 size-4 animate-spin" /> : null}
								Publish on the website
							</Button>
							<Button type="button" variant="outline" disabled={pending} onClick={() => submit(false)} className="h-12 rounded-2xl">
								Save draft
							</Button>
						</>
					) : (
						<Button type="button" disabled={pending || !form.formState.isDirty} onClick={() => submit(false)} className="h-12 flex-1 rounded-2xl text-base font-semibold">
							{pending ? <Refresh className="mr-2 size-4 animate-spin" /> : null}
							{form.formState.isDirty ? (published ? "Save and update the website" : "Save changes") : "Saved"}
						</Button>
					)}
				</div>
			</form>
		</Form>
	);
}
