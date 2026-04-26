"use client";

import { useEffect, useMemo, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { getClientsByEmailsAction } from "@/lib/actions/clients/queries";
import { cn } from "@/lib/utils/ui";

import type { calendar_v3 } from "googleapis";
import {
	Call,
	CloseCircle,
	Profile2User,
	SearchNormal1,
	Sms,
	TickCircle,
	UserSquare,
	Whatsapp,
} from "iconsax-reactjs";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

type Attendee = calendar_v3.Schema$EventAttendee;

interface ClientMatch {
	email: string;
	clientId: string;
	fullName: string;
	photoUrl: string | null;
	phone: string | null;
}

/** Enriched attendee with client-match info */
interface EnrichedGuest {
	email: string;
	displayName: string;
	isClient: boolean;
	clientId?: string;
	photoUrl?: string | null;
	phone?: string | null;
}

type FilterMode = "all" | "clients" | "guests";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
	return name
		.split(/\s+/)
		.map((w) => w[0])
		.filter(Boolean)
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

// ─── Exports ─────────────────────────────────────────────────────────────────

interface GuestAvatarStackProps {
	attendees: Attendee[];
}

export function GuestAvatarStack({ attendees }: GuestAvatarStackProps) {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [clientMatches, setClientMatches] = useState<ClientMatch[]>([]);
	const [matchesLoaded, setMatchesLoaded] = useState(false);

	// Filter out the organizer (self) from attendees
	const guests = useMemo(
		() => attendees.filter((a) => !a.self && !a.organizer && a.email),
		[attendees],
	);

	// Eagerly resolve client emails on mount for photo display in the stack
	useEffect(() => {
		const emails = guests.map((g) => g.email).filter((e): e is string => !!e);
		if (emails.length === 0) return;

		getClientsByEmailsAction(emails).then((matches) => {
			setClientMatches(matches);
			setMatchesLoaded(true);
		});
	}, [guests]);

	// Build a lookup map from email → client match
	const clientMap = useMemo(() => {
		const map = new Map<string, ClientMatch>();
		for (const m of clientMatches) {
			map.set(m.email.toLowerCase(), m);
		}
		return map;
	}, [clientMatches]);

	// Enrich guests
	const enrichedGuests: EnrichedGuest[] = useMemo(
		() =>
			guests.map((g) => {
				const match = clientMap.get(g.email!.toLowerCase());
				return {
					email: g.email!,
					displayName: match?.fullName || g.displayName || g.email!,
					isClient: !!match,
					clientId: match?.clientId,
					photoUrl: match?.photoUrl,
					phone: match?.phone,
				};
			}),
		[guests, clientMap],
	);

	if (guests.length === 0) return null;

	const MAX_VISIBLE = 5;
	const visible = enrichedGuests.slice(0, MAX_VISIBLE);
	const overflow = enrichedGuests.length - MAX_VISIBLE;

	return (
		<>
			{/* ── Compact Kebab Avatar Stack (inline) ── */}
			<TooltipProvider delayDuration={200}>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={() => setDialogOpen(true)}
							className="group/stack flex items-center rounded-full transition-all duration-200 hover:opacity-80"
							aria-label={`View ${enrichedGuests.length} participants`}
						>
							<div className="flex items-center -space-x-1.5">
								{visible.map((guest, i) => (
									<Avatar
										key={guest.email}
										className={cn(
											"size-6 ring-[1.5px] transition-transform duration-200",
											guest.isClient ? "ring-primary" : "ring-card",
										)}
										style={{ zIndex: MAX_VISIBLE - i }}
									>
										{guest.isClient && guest.photoUrl ? (
											<AvatarImage src={guest.photoUrl} />
										) : null}
										<AvatarFallback
											className={cn(
												"text-[8px] font-bold",
												guest.isClient
													? "bg-primary/15 text-primary"
													: "bg-muted text-muted-foreground",
											)}
										>
											{getInitials(guest.displayName)}
										</AvatarFallback>
									</Avatar>
								))}
							</div>

							{overflow > 0 ? (
								<span className="bg-muted text-muted-foreground -ml-1 flex size-6 items-center justify-center rounded-full text-[9px] font-bold ring-[1.5px] ring-card">
									+{overflow}
								</span>
							) : null}
						</button>
					</TooltipTrigger>
					<TooltipContent
						sideOffset={8}
						side="bottom"
						className="zen-shadow-md z-50 w-64 rounded-2xl border-0 bg-card p-4"
					>
						<AnalyticsBar guests={enrichedGuests} />
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			{/* ── Participants Dialog ── */}
			<ParticipantsDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				guests={enrichedGuests}
				isLoading={!matchesLoaded}
			/>
		</>
	);
}

// ─── Participants Dialog ─────────────────────────────────────────────────────

function ParticipantsDialog({
	open,
	onOpenChange,
	guests,
	isLoading,
}: {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	guests: EnrichedGuest[];
	isLoading: boolean;
}) {
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<FilterMode>("all");

	// Reset on close
	useEffect(() => {
		if (!open) {
			setSearch("");
			setFilter("all");
		}
	}, [open]);

	// Filtered list
	const filtered = useMemo(() => {
		let list = guests;

		if (filter === "clients") list = list.filter((g) => g.isClient);
		if (filter === "guests") list = list.filter((g) => !g.isClient);

		if (search.trim()) {
			const q = search.toLowerCase();
			list = list.filter(
				(g) =>
					g.displayName.toLowerCase().includes(q) ||
					g.email.toLowerCase().includes(q),
			);
		}

		return list;
	}, [guests, filter, search]);

	const FILTERS: { key: FilterMode; label: string }[] = [
		{ key: "all", label: "All" },
		{ key: "clients", label: "Clients" },
		{ key: "guests", label: "Non-Clients" },
	];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton
				className="flex max-h-[85vh] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-md"
			>
				{/* ── Header ── */}
				<DialogHeader className="border-border/50 space-y-4 border-b px-6 pt-6 pb-5">
					<div className="flex items-center gap-4">
						<DialogTitle className="font-heading text-foreground text-2xl font-bold">
							<div className="flex items-center gap-2.5">
								<div className="bg-primary/10 rounded-xl p-2">
									<Profile2User
										className="text-primary h-5 w-5"
										variant="Bulk"
									/>
								</div>
								Participants
							</div>
						</DialogTitle>
						<span className="bg-secondary text-secondary-foreground rounded-full px-2.5 py-1 text-sm font-bold tabular-nums">
							{guests.length}
						</span>
					</div>

					{/* ── Search ── */}
					<div className="relative flex items-center">
						<SearchNormal1
							className="text-primary/60 absolute left-3.5 size-4.5 shrink-0"
							variant="Outline"
						/>
						<Input
							placeholder="Search participants..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-11 rounded-xl pl-9.5 pr-10"
							autoComplete="off"
						/>
						{search ? (
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								onClick={() => setSearch("")}
								className="text-muted-foreground hover:bg-muted hover:text-foreground absolute right-1 size-7 rounded-full"
							>
								<CloseCircle className="size-4" variant="Outline" />
							</Button>
						) : null}
					</div>

					{/* ── Filter Pills ── */}
					<div className="flex gap-1.5">
						{FILTERS.map((f) => (
							<Button
								key={f.key}
								type="button"
								variant={filter === f.key ? "default" : "ghost"}
								size="sm"
								onClick={() => setFilter(f.key)}
								className={cn(
									"rounded-full px-4 text-xs font-semibold tracking-wide",
									filter !== f.key &&
										"text-muted-foreground bg-muted hover:bg-muted/80",
								)}
							>
								{f.label}
							</Button>
						))}
					</div>
				</DialogHeader>

				{/* ── Analytics Bar ── */}
				<div className="border-border/50 border-b px-6 py-4">
					<AnalyticsBar guests={guests} />
				</div>

				{/* ── Participant List ── */}
				<ScrollArea className="flex-1 overflow-y-auto">
					<div className="flex flex-col gap-0.5 p-3">
						{isLoading ? (
							<div className="flex flex-col gap-3 py-6">
								{Array.from({ length: 4 }).map((_, i) => (
									<div key={i} className="flex items-center gap-3 px-3">
										<div className="bg-muted size-10 animate-pulse rounded-full" />
										<div className="flex flex-1 flex-col gap-1.5">
											<div className="bg-muted h-3.5 w-28 animate-pulse rounded-md" />
											<div className="bg-muted h-3 w-40 animate-pulse rounded-md" />
										</div>
									</div>
								))}
							</div>
						) : filtered.length === 0 ? (
							<div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
								<UserSquare
									className="mb-3 h-10 w-10 opacity-20"
									variant="Outline"
								/>
								<p className="text-sm font-medium">No participants found</p>
								<p className="mt-1 text-xs">
									Try adjusting your search or filters
								</p>
							</div>
						) : (
							filtered.map((guest, i) => (
								<div
									key={guest.email}
									className="animate-slide-up hover:bg-muted/50 flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors"
									style={{
										animationFillMode: "both",
										animationDelay: `${i * 30}ms`,
										animationDuration: "350ms",
									}}
								>
									{/* Avatar */}
									<div className="relative shrink-0">
										<Avatar
											className={cn(
												"size-10 ring-2",
												guest.isClient ? "ring-primary" : "ring-border",
											)}
										>
											{guest.isClient && guest.photoUrl ? (
												<AvatarImage src={guest.photoUrl} />
											) : null}
											<AvatarFallback
												className={cn(
													"text-xs font-bold",
													guest.isClient
														? "bg-primary/10 text-primary"
														: "bg-muted text-muted-foreground",
												)}
											>
												{getInitials(guest.displayName)}
											</AvatarFallback>
										</Avatar>
										{guest.isClient ? (
											<div className="bg-card absolute -right-0.5 -bottom-0.5 rounded-full p-px">
												<TickCircle
													className="text-primary h-3.5 w-3.5"
													variant="Bulk"
												/>
											</div>
										) : null}
									</div>

									{/* Name + Email */}
									<div className="flex min-w-0 flex-1 flex-col">
										<span className="text-foreground truncate text-sm font-semibold">
											{guest.displayName}
										</span>
										<span className="text-muted-foreground truncate text-xs">
											{guest.email}
										</span>
									</div>

									{/* Contact Actions (for clients) */}
									{guest.isClient ? (
										<TooltipProvider delayDuration={150}>
											<div className="flex items-center gap-1.5 px-2">
												{guest.email ? (
													<Tooltip>
														<TooltipTrigger asChild>
															<Link
																href={`mailto:${guest.email}`}
																className="flex size-7 items-center justify-center rounded-xl bg-secondary text-secondary-3/80 transition-all hover:scale-105 hover:bg-secondary-2 hover:text-white active:scale-95"
															>
																<Sms className="size-4" variant="Bold" />
															</Link>
														</TooltipTrigger>
														<TooltipContent
															sideOffset={6}
															className="zen-shadow-sm z-50 rounded-lg border-0 px-2 py-1 text-[11px] font-bold"
														>
															{guest.email}
														</TooltipContent>
													</Tooltip>
												) : null}

												{guest.phone ? (
													<>
														<Tooltip>
															<TooltipTrigger asChild>
																<Link
																	href={`https://wa.me/${guest.phone.replace(/[^0-9]/g, "")}`}
																	target="_blank"
																	className="flex size-7 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366] transition-all hover:scale-105 hover:bg-[#25D366] hover:text-white active:scale-95"
																>
																	<Whatsapp className="size-4" variant="Bold" />
																</Link>
															</TooltipTrigger>
															<TooltipContent
																sideOffset={6}
																className="zen-shadow-sm z-50 rounded-lg border-0 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700"
															>
																WhatsApp: {guest.phone}
															</TooltipContent>
														</Tooltip>

														<Tooltip>
															<TooltipTrigger asChild>
																<Link
																	href={`tel:${guest.phone}`}
																	className="flex size-7 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all hover:scale-105 hover:bg-primary hover:text-primary-foreground active:scale-95"
																>
																	<Call className="size-4" variant="Bold" />
																</Link>
															</TooltipTrigger>
															<TooltipContent
																sideOffset={6}
																className="zen-shadow-sm z-50 rounded-lg border-0 px-2 py-1 text-[11px] font-bold"
															>
																Call: {guest.phone}
															</TooltipContent>
														</Tooltip>
													</>
												) : null}
											</div>
										</TooltipProvider>
									) : null}

									{/* Client / Guest badge */}
									{guest.isClient ? (
										<Badge
											variant="default"
											className="shrink-0 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase"
										>
											Client
										</Badge>
									) : (
										<Badge
											variant="muted"
											className="shrink-0 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase"
										>
											Guest
										</Badge>
									)}
								</div>
							))
						)}
					</div>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}

// ─── Analytics Bar Component ───────────────────────────────────────────────────

export function AnalyticsBar({ guests }: { guests: EnrichedGuest[] }) {
	const clientCount = guests.filter((g) => g.isClient).length;
	const guestCount = guests.length - clientCount;
	const clientPct =
		guests.length > 0 ? Math.round((clientCount / guests.length) * 100) : 0;

	return (
		<div className="w-full">
			<div className="flex items-center justify-between text-xs font-medium">
				<span className="text-primary flex items-center gap-1.5">
					<span className="bg-primary inline-block size-2 rounded-full" />
					Clients · {clientCount}{" "}
					<span className="text-muted-foreground">({clientPct}%)</span>
				</span>
				<span className="flex items-center gap-1.5 text-muted-foreground">
					<span className="bg-secondary-2 inline-block size-2 rounded-full" />
					Guests · {guestCount}{" "}
					<span className="text-muted-foreground">({100 - clientPct}%)</span>
				</span>
			</div>
			<div className="bg-muted mt-2.5 h-2 w-full overflow-hidden rounded-full">
				<div
					className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
					style={{ width: `${clientPct}%` }}
				/>
			</div>
		</div>
	);
}
