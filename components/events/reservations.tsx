"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { FormSheet } from "@/components/form-sheet";
import { RequestStatus } from "@/components/requests/request-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { addReservationAction, setReservationPaidAction } from "@/lib/actions/events";
import { setRequestStatusAction } from "@/lib/actions/requests/mutations";
import { type Places } from "@/lib/domain/events/rules";
import { toE164 } from "@/lib/domain/requests/phone";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { whatsappHref } from "@/lib/utils/contact";
import { cn } from "@/lib/utils/ui";
import { type BookingRequest } from "@/services/database/schema";

import { Add, People, Refresh, TickCircle, Warning2, Whatsapp } from "iconsax-reactjs";

const SOURCES: Record<BookingRequest["source"], string> = {
	website: "Website",
	whatsapp: "WhatsApp",
	phone: "Phone",
	in_person: "In person",
};

/** "8 of 12 places confirmed · 5 paid", or "8 confirmed · 5 paid" without a limit. */
export function placesLine(places: Places, paidPeople: number) {
	const confirmed = places.capacity === null ? `${places.confirmed} confirmed` : `${places.confirmed} of ${places.capacity} places confirmed`;
	return `${confirmed} · ${paidPeople} paid`;
}

/** Who's coming: each reservation with its people, where it came from, its status, and a Paid tick once confirmed. */
export function Reservations({ eventId, reservations, places, cancelled }: { eventId: string; reservations: BookingRequest[]; places: Places; cancelled: boolean }) {
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const paidPeople = reservations.filter((r) => r.status === "confirmed" && r.paidAt).reduce((n, r) => n + r.partySize, 0);

	const run = (action: () => Promise<{ error?: string; ref?: string }>, done: string) =>
		startTransition(async () => {
			const result = await action();
			if (result.error) return void notifyActionError(result, "Couldn't change it");
			notify.success(done);
			router.refresh();
		});

	return (
		<section aria-labelledby="who-title" className="grid gap-3">
			<div className="flex min-h-10 flex-wrap items-center justify-between gap-3">
				<h2 id="who-title" className="font-heading text-lg font-semibold">
					Who’s coming
				</h2>
				<div className="flex items-center gap-3">
					<span className={cn("text-sm tabular-nums", places.full ? "font-semibold text-warning" : "text-muted-foreground")}>
						{places.full ? "Full · " : null}
						{placesLine(places, paidPeople)}
					</span>
					{cancelled ? null : <AddReservation eventId={eventId} />}
				</div>
			</div>
			<div className="rounded-3xl border border-secondary/20 bg-card">
				{reservations.length ? (
					<ul className="divide-y divide-border/60">
						{reservations.map((r) => {
							const confirmed = r.status === "confirmed";
							return (
								<li key={r.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
									<div className="flex min-w-0 flex-col gap-1">
										<div className="flex flex-wrap items-center gap-2">
											<span className="font-medium text-foreground">{r.erasedAt ? "Details erased" : r.name}</span>
											<RequestStatus status={r.status} />
											{r.partySize > 1 ? (
												<span className="inline-flex h-7 items-center gap-1 rounded-full bg-muted px-2.5 text-sm text-foreground">
													<People size={14} variant="Bulk" />
													{r.partySize}
												</span>
											) : null}
										</div>
										<span className="text-sm text-muted-foreground">
											{SOURCES[r.source]}
											{r.phone ? ` · ${r.phone}` : ""}
										</span>
										{r.arrivedWhenFull && r.status === "new" ? (
											<span className="flex items-center gap-1.5 text-sm text-warning">
												<Warning2 size={14} variant="Bold" />
												Came in when the event was full
											</span>
										) : null}
									</div>
									<div className="flex flex-wrap items-center gap-2">
										{r.phone && !r.erasedAt ? (
											<a
												href={whatsappHref(toE164(r.phone) ?? r.phone)}
												target="_blank"
												rel="noopener noreferrer"
												aria-label={`WhatsApp ${r.name}`}
												className="flex size-11 items-center justify-center rounded-full bg-[#25D366]/15 text-[#128C7E] transition-colors hover:bg-[#25D366]/25 active:scale-95"
											>
												<Whatsapp size={20} variant="Bold" />
											</a>
										) : null}
										{r.status === "new" ? (
											<>
												<Button size="sm" disabled={pending} onClick={() => run(() => setRequestStatusAction(r.id, "confirmed"), "Confirmed")} className="h-11 rounded-full px-4">
													<TickCircle size={18} variant="Bold" />
													Confirm
												</Button>
												<Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setRequestStatusAction(r.id, "declined"), "Declined")} className="h-11 rounded-full px-3">
													Decline
												</Button>
											</>
										) : null}
										{confirmed ? (
											<label className="flex h-11 cursor-pointer items-center gap-2 rounded-full bg-muted px-3 text-sm font-medium">
												<Switch
													checked={!!r.paidAt}
													disabled={pending}
													onCheckedChange={(paid) => run(() => setReservationPaidAction(r.id, paid), paid ? "Marked paid" : "Not paid")}
													aria-label={`${r.name} paid`}
												/>
												Paid
											</label>
										) : null}
									</div>
								</li>
							);
						})}
					</ul>
				) : (
					<p className="px-6 py-10 text-center text-sm text-muted-foreground">No reservations yet. Bookings from the website and the ones you add show here.</p>
				)}
			</div>
		</section>
	);
}

/** A reservation taken outside the website: by WhatsApp, phone or in person. */
function AddReservation({ eventId }: { eventId: string }) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [pending, startTransition] = useTransition();
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [people, setPeople] = useState("1");
	const [source, setSource] = useState<BookingRequest["source"]>("whatsapp");

	const save = () =>
		startTransition(async () => {
			const result = await addReservationAction(eventId, { name, phone, partySize: people, source });
			if (result.error) return void notifyActionError(result, "Couldn't add the reservation");
			notify.success("Reservation added");
			setOpen(false);
			setName("");
			setPhone("");
			setPeople("1");
			router.refresh();
		});

	return (
		<FormSheet
			open={open}
			onOpenChange={setOpen}
			trigger={
				<Button size="sm" className="h-10 rounded-full">
					<Add size={18} />
					Add reservation
				</Button>
			}
			busy={pending}
			dirty={!!(name || phone)}
			icon={<People size={26} variant="Bulk" />}
			title="Add a reservation"
			description="Someone who booked by WhatsApp, phone or in person. It's confirmed, and takes its places."
			footer={
				<Button onClick={save} disabled={pending} className="h-11 rounded-xl">
					{pending ? <Refresh className="mr-2 size-4 animate-spin" /> : null}
					Add reservation
				</Button>
			}
		>
			<div className="grid gap-4 py-2">
				<label className="grid gap-2 text-sm font-medium">
					Name
					<Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" className="h-11" />
				</label>
				<label className="grid gap-2 text-sm font-medium">
					Phone
					<Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="06 61 28 64 64" className="h-11" />
				</label>
				<div className="grid grid-cols-2 gap-4">
					<label className="grid gap-2 text-sm font-medium">
						People
						<Input value={people} onChange={(e) => setPeople(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="h-11 tabular-nums" />
					</label>
					<label className="grid gap-2 text-sm font-medium">
						Booked by
						<Select value={source} onValueChange={(v) => setSource(v as BookingRequest["source"])}>
							<SelectTrigger className="h-11">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="whatsapp">WhatsApp</SelectItem>
								<SelectItem value="phone">Phone</SelectItem>
								<SelectItem value="in_person">In person</SelectItem>
							</SelectContent>
						</Select>
					</label>
				</div>
			</div>
		</FormSheet>
	);
}
