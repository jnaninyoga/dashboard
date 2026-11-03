"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { HealthAlertButton } from "@/components/clients/health-alert-button";
import { CardAtTheDoor, ClientSearch } from "@/components/clients/search";
import { SellMembershipSheet } from "@/components/clients/sell-membership-sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { type AttendanceRecord, checkInClientAction, undoCheckInAction } from "@/lib/actions/schedule/attendance";
import { creditsSummary, sortAlerts } from "@/lib/domain/clients/card";
import { notify } from "@/lib/feedback/notify";
import { type ClientWithRelations, type Discount, type Product } from "@/lib/types";
import { toStudioTime } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";
import { type JnaninEventType } from "@/services/google";

import { format } from "date-fns";
import { ArrowRotateLeft, CloseCircle, Danger, Profile2User, TickCircle } from "iconsax-reactjs";

import { HealthGuardrailDialog } from "./health-guardrail";

type Person = { id: string; fullName: string; photoUrl: string | null };

/** A client's photo, or their initial on the brand's teal or blush (the same one every time). */
function PersonAvatar({ person, className }: { person: Person; className?: string }) {
	const blush = [...person.fullName].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 2 === 1;
	return (
		<Avatar className={cn("size-11", className)}>
			<AvatarImage src={person.photoUrl || undefined} alt="" />
			<AvatarFallback className={cn("font-semibold", blush ? "bg-secondary text-secondary-3" : "bg-primary/10 text-primary")}>
				{person.fullName.charAt(0)}
			</AvatarFallback>
		</Avatar>
	);
}

const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0];

/** A check-in would be refused for want of a card (outdoor sessions take none). */
const needsCard = (client: ClientWithRelations) => {
	const credits = creditsSummary(client.wallets);
	return credits.count === null || credits.count === 0;
};

interface CheckInManagerProps {
	eventId: string;
	eventType: JnaninEventType | string;
	initialAttendance: AttendanceRecord[];
	/** Over or cancelled: who came, read-only. */
	isPast?: boolean;
	/** The session was cancelled: history only, and the credits went back. */
	cancelled?: boolean;
	/** Who usually comes to this class, to check in with one tap. */
	usual?: ClientWithRelations[];
	/** Her memberships on sale and her discounts, to sell a card at the door. */
	memberships?: Product[];
	discounts?: Discount[];
}

/**
 * The door of a session. She finds a client (or taps one of the regulars),
 * reads their health alerts when they have some, and they're in; a client
 * whose card can't pay can be sold one right here, and is then let in. The
 * clients here are listed beside it, newest first, a mistaken tap a tap away
 * from undone while the session runs.
 */
export function CheckInManager({
	eventId,
	eventType,
	initialAttendance,
	isPast = false,
	cancelled = false,
	usual = [],
	memberships = [],
	discounts = [],
}: CheckInManagerProps) {
	const router = useRouter();
	const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
	const [guarded, setGuarded] = useState<ClientWithRelations | null>(null);
	const [busy, setBusy] = useState<string | null>(null);
	// Why the last client tapped wasn't let in. It stays until she acts on
	// it or checks someone in: a toast would be gone before she reads it.
	const [refusal, setRefusal] = useState<{ client: ClientWithRelations; message: string; needsCard: boolean } | null>(null);
	// The client she's selling a card to, at the door; checked in once it's sold.
	const [sellTo, setSellTo] = useState<ClientWithRelations | null>(null);
	const [fresh, setFresh] = useState<string | null>(null);

	const present = attendance.filter((record) => !record.cancelledAt);
	const here = new Set(present.map((record) => record.client.id));
	const isPrivate = eventType === "private";
	// A private session is one client: once they're in, the door closes.
	const doorOpen = !isPast && !(isPrivate && present.length > 0);
	const waiting = usual.filter((client) => !here.has(client.id));

	// Synchronous latch: state updates land a render late, so a fast double
	// tap would otherwise fire two check-ins.
	const inFlight = useRef(false);

	const checkIn = async (client: ClientWithRelations) => {
		if (inFlight.current) return;
		inFlight.current = true;
		setBusy(client.id);
		try {
			const res = await checkInClientAction(client.id, eventId, eventType as JnaninEventType);
			if (!res.success) {
				if (res.ref) notify.error(res.message, { code: res.ref });
				else setRefusal({ client, message: res.message, needsCard: !!res.needsCard });
				return;
			}
			setRefusal(null);
			notify.success(`${client.fullName} is checked in`, res.note);
			const record: AttendanceRecord = {
				id: res.record?.id ?? crypto.randomUUID(),
				checkInTime: res.record?.checkInTime ?? new Date().toISOString(),
				cancelledAt: null,
				slotType: eventType as JnaninEventType,
				client: {
					id: client.id,
					fullName: client.fullName,
					photoUrl: client.photoUrl ?? null,
					healthLogs: (client.healthLogs ?? []).filter((log) => log.isAlert),
				},
			};
			setAttendance((current) => [record, ...current]);
			setFresh(record.id);
		} catch {
			notify.error("Check-in failed. Please try again.");
		} finally {
			inFlight.current = false;
			setBusy(null);
			setGuarded(null);
		}
	};

	// Health alerts are read first; everyone else goes straight in.
	const onPick = (client: ClientWithRelations) => {
		if (isPast || here.has(client.id)) return;
		if (client.healthLogs?.some((log) => log.isAlert)) setGuarded(client);
		else checkIn(client);
	};

	const undo = async (record: AttendanceRecord) => {
		setBusy(record.id);
		const res = await undoCheckInAction(record.id);
		setBusy(null);
		if (!res.success) {
			notify.error(res.message, res.ref ? { code: res.ref } : undefined);
			return;
		}
		setAttendance((current) => current.filter((r) => r.id !== record.id));
		// The credit went back: the regulars' cards say so.
		router.refresh();
		notify.success(res.message, firstName(record.client.fullName) + " isn't on the list any more.");
	};

	return (
		<div
			className={cn(
				"grid gap-6",
				doorOpen ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start xl:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]" : "max-w-3xl",
			)}
		>
			{doorOpen ? (
				<section aria-label="Check in" className="flex min-w-0 flex-col gap-6">
					{/* Stays in reach on a phone while she scrolls the regulars. */}
					<div className="sticky top-14 z-30 -mx-4 flex items-center gap-2 bg-background/85 px-4 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:static lg:m-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
						<div className="min-w-0 flex-1">
							<ClientSearch onSelectClient={onPick} here={here} autoFocus />
						</div>
						{/* On a phone the list is below the regulars: how many are in, a tap away. */}
						{present.length ? (
							<a
								href="#here-title"
								aria-label={`${present.length} checked in: see who`}
								className="flex h-14 shrink-0 flex-col items-center justify-center rounded-2xl border bg-card px-3 leading-none text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
							>
								<span className="font-heading text-xl font-semibold text-primary tabular-nums">{present.length}</span>
								<span className="text-xs text-muted-foreground">here</span>
							</a>
						) : null}
					</div>

					{refusal ? (
						<div
							role="alert"
							className="flex animate-in flex-wrap items-center gap-x-4 gap-y-3 rounded-3xl border border-destructive/25 bg-destructive/5 p-4 duration-200 fade-in-0 slide-in-from-top-1 motion-reduce:animate-none md:p-5"
						>
							<Danger className="size-7 shrink-0 text-destructive" variant="Bulk" />
							<div className="min-w-0 flex-1 basis-56">
								<p className="font-semibold text-foreground">{refusal.client.fullName} isn&apos;t checked in</p>
								<p className="text-sm text-muted-foreground">{refusal.message}</p>
							</div>
							<div className="flex items-center gap-2">
								{refusal.needsCard ? (
									<Button onClick={() => setSellTo(refusal.client)} className="h-11 rounded-xl px-4 font-semibold">
										Sell and check in
									</Button>
								) : null}
								<Button variant="ghost" size="icon" aria-label="Dismiss" className="size-11 rounded-xl" onClick={() => setRefusal(null)}>
									<CloseCircle className="size-5" variant="Outline" />
								</Button>
							</div>
						</div>
					) : null}

					{waiting.length ? (
						<section aria-labelledby="usual-title" className="flex flex-col gap-3">
							<div className="flex flex-col gap-0.5">
								<h2 id="usual-title" className="font-heading text-xl font-semibold text-foreground">
									Usually here
								</h2>
								<p className="text-sm text-muted-foreground">Seen most at this class lately. Tap to check in.</p>
							</div>
							<ul className="divide-y divide-border rounded-3xl border bg-card">
								{waiting.map((client) => (
									<li key={client.id} className="flex items-center gap-3 px-4 py-3">
										<PersonAvatar person={{ id: client.id, fullName: client.fullName, photoUrl: client.photoUrl ?? null }} />
										<span className="flex min-w-0 flex-1 flex-col">
											<span className="flex min-w-0 items-center gap-1.5">
												<span className="truncate font-semibold text-foreground">{client.fullName}</span>
												{client.healthLogs?.some((log) => log.isAlert) ? (
													<Danger size={16} variant="Bold" className="shrink-0 text-destructive" aria-label="Health alerts" role="img" />
												) : null}
											</span>
											<span className="truncate text-sm">
												<CardAtTheDoor wallets={client.wallets} />
											</span>
										</span>
										{eventType !== "outdoor" && needsCard(client) ? (
											// Their card can't pay: sell one, and they're in.
											<Button
												variant="outline"
												onClick={() => setSellTo(client)}
												disabled={busy !== null}
												aria-label={`Sell ${client.fullName} a membership and check them in`}
												className="h-11 shrink-0 rounded-full px-4 font-semibold"
											>
												Sell
											</Button>
										) : (
											<Button
												onClick={() => onPick(client)}
												disabled={busy !== null}
												aria-label={`Check in ${client.fullName}`}
												className="h-11 shrink-0 rounded-full px-4 font-semibold"
											>
												{busy === client.id ? "Checking…" : "Check in"}
											</Button>
										)}
									</li>
								))}
							</ul>
						</section>
					) : null}
				</section>
			) : null}

			<section aria-labelledby="here-title" className={cn("flex min-w-0 scroll-mt-36 flex-col gap-3", doorOpen && "lg:sticky lg:top-20")}>
				<div className="flex items-end justify-between gap-3">
					<div className="flex flex-col gap-0.5">
						<h2 id="here-title" className="font-heading text-xl font-semibold text-foreground">
							{cancelled ? "Checked in before it was cancelled" : isPast ? "Who came" : "Here"}
						</h2>
						<p className="text-sm text-muted-foreground">
							{cancelled
								? "Their credits went back."
								: present.length
									? `${present.length} ${present.length === 1 ? "client" : "clients"}${isPast ? "" : " checked in"}`
									: isPast
										? "No one was checked in."
										: "No one yet."}
						</p>
					</div>
					{present.length ? (
						<span className="font-heading text-4xl leading-none font-semibold text-primary tabular-nums" aria-hidden>
							{present.length}
						</span>
					) : null}
				</div>

				{attendance.length === 0 ? (
					<div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed px-6 py-10 text-center text-muted-foreground">
						<Profile2User size={36} variant="Bulk" className="text-primary/40" />
						<p className="max-w-64 text-sm">
							{isPast
								? cancelled
									? "The session was cancelled before anyone checked in."
									: "This session ended with no attendance recorded."
								: "Find a client above, or tap one of the regulars, and they appear here."}
						</p>
					</div>
				) : (
					<ul className="divide-y divide-border rounded-3xl border bg-card">
						{attendance.map((record) => {
							const alerts = sortAlerts(record.client.healthLogs ?? []);
							const gone = !!record.cancelledAt;
							return (
								<li
									key={record.id}
									className={cn(
										"flex flex-col gap-3 px-4 py-3 transition-colors duration-1000",
										record.id === fresh && "animate-in bg-success/5 duration-300 fade-in-0 slide-in-from-top-2 motion-reduce:animate-none",
									)}
								>
									<div className="flex items-center gap-3">
										<span className="relative shrink-0">
											<PersonAvatar person={record.client} />
											<span className="absolute -right-1 -bottom-1 rounded-full bg-card p-0.5">
												{gone ? (
													<ArrowRotateLeft className="size-4 text-muted-foreground" variant="Bold" />
												) : (
													<TickCircle className="size-4 text-success" variant="Bold" />
												)}
											</span>
										</span>
										<span className="flex min-w-0 flex-1 flex-col">
											<Link
												href={`/clients/${record.client.id}`}
												className="truncate font-semibold text-foreground transition-colors hover:text-primary"
											>
												{record.client.fullName}
											</Link>
											<span className="text-sm text-muted-foreground tabular-nums">
												{format(toStudioTime(new Date(record.checkInTime)), "HH:mm")}
												{gone ? ", credit given back" : ""}
											</span>
										</span>
										{alerts.length && !isPrivate ? <HealthAlertButton clientName={record.client.fullName} alerts={alerts} /> : null}
										{!isPast && !gone ? (
											<Button
												variant="ghost"
												size="icon"
												onClick={() => undo(record)}
												disabled={busy !== null}
												aria-label={`Take back ${record.client.fullName}'s check-in`}
												title="Checked in by mistake? Take it back"
												className="size-11 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
											>
												<ArrowRotateLeft size={18} />
											</Button>
										) : null}
									</div>

									{/* A private session is one client: their alerts stay in view for the whole hour. */}
									{isPrivate && alerts.length ? (
										<ul className="grid gap-2">
											{alerts.map((log) => (
												<li
													key={log.id}
													className={cn(
														"rounded-2xl border-l-4 px-4 py-3",
														log.severity === "critical" ? "border-l-destructive bg-destructive/5" : "border-l-warning bg-warning/5",
													)}
												>
													<p className="font-medium text-foreground">{log.condition}</p>
													{log.treatment ? <p className="text-sm text-muted-foreground">{log.treatment}</p> : null}
												</li>
											))}
										</ul>
									) : null}
								</li>
							);
						})}
					</ul>
				)}
			</section>

			{sellTo ? (
				<SellMembershipSheet
					clientId={sellTo.id}
					memberships={memberships}
					discounts={discounts}
					clientDiscountId={sellTo.discountId}
					open
					onOpenChange={(open) => !open && setSellTo(null)}
					onSold={() => {
						router.refresh();
						onPick(sellTo);
					}}
				/>
			) : null}

			<HealthGuardrailDialog
				isOpen={!!guarded}
				clientData={guarded}
				onAcknowledge={() => guarded && checkIn(guarded)}
				onCancel={() => setGuarded(null)}
				isPending={busy !== null}
			/>
		</div>
	);
}
