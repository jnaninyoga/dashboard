"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getClientsAction } from "@/lib/actions/clients/queries";
import { creditsSummary } from "@/lib/domain/clients/card";
import { RENEW_WITHIN_DAYS } from "@/lib/domain/clients/renewal";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { type ClientWithRelations } from "@/lib/types";
import { addDays, formatDay, studioDateString } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";

import { CloseCircle, Danger, Refresh, SearchNormal1, TickCircle } from "iconsax-reactjs";

const weekDay = (date: string) => formatDay(date, { weekday: "short", day: "numeric", month: "short" });

/**
 * Their card, as the door sees it, before she taps: the credits they can
 * use (and an end within the week), or why a check-in would be refused.
 */
export function CardAtTheDoor({ wallets }: { wallets: ClientWithRelations["wallets"] }) {
	const today = studioDateString();
	const credits = creditsSummary(wallets, today);
	if (credits.count === null) return <span className="text-muted-foreground">No card</span>;
	if (credits.tone === "expired") return <span className="text-destructive font-medium">Card expired {weekDay(credits.expiredOn!)}</span>;
	if (!credits.count) return <span className="text-destructive font-medium">No credits left</span>;
	const ends = credits.endsOn && credits.endsOn <= addDays(today, RENEW_WITHIN_DAYS) ? credits.endsOn : null;
	return (
		<span className={cn("tabular-nums", credits.tone === "low" ? "text-warning font-medium" : "text-muted-foreground")}>
			{credits.count} {credits.count === 1 ? "credit" : "credits"}
			{credits.tone === "low" ? " left" : ""}
			{ends ? <span className="text-warning font-medium">, ends {ends === today ? "today" : weekDay(ends)}</span> : null}
		</span>
	);
}

/**
 * Finds a client by name, phone or email as she types, each with their card
 * as the door sees it; Enter takes the first. Clients already checked in
 * (`here`) say so and can't be picked twice.
 */
export function ClientSearch({
	onSelectClient,
	here,
	autoFocus = false,
}: {
	onSelectClient: (client: ClientWithRelations) => void;
	here?: Set<string>;
	/** Focus on screens with a mouse, where no keyboard pops up to cover the page. */
	autoFocus?: boolean;
}) {
	const [searchQuery, setSearchQuery] = React.useState("");
	// The latest answer, with the words it answers.
	const [results, setResults] = React.useState<{ query: string; clients: ClientWithRelations[] }>({ query: "", clients: [] });
	const [isFocused, setIsFocused] = React.useState(false);
	const debouncedQuery = useDebounce(searchQuery, 250);
	const inputRef = React.useRef<HTMLInputElement>(null);
	const containerRef = React.useRef<HTMLDivElement>(null);
	const listId = React.useId();

	React.useEffect(() => {
		if (autoFocus && window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
	}, [autoFocus]);

	// Close the results on an outside click.
	React.useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsFocused(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	React.useEffect(() => {
		let isMounted = true;
		const query = debouncedQuery.trim();
		if (!query) return;
		getClientsAction(1, 8, query, { discountId: "all" }).then((res) => {
			if (isMounted) setResults({ query, clients: res.success && res.data ? res.data : [] });
		});
		return () => {
			isMounted = false;
		};
	}, [debouncedQuery]);

	const pick = (client: ClientWithRelations) => {
		if (here?.has(client.id)) return;
		onSelectClient(client);
		setSearchQuery("");
		inputRef.current?.blur();
		setIsFocused(false);
	};

	const typed = searchQuery.trim().length > 0;
	const showDropdown = isFocused && typed;
	// Still answering what she typed: the last answer shows meanwhile.
	const waiting = results.query !== searchQuery.trim();
	const clients = results.clients;

	return (
		<div ref={containerRef} className="relative w-full">
			<div
				className={cn(
					"bg-card flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 transition-shadow duration-200",
					isFocused ? "ring-primary/25 border-primary/40 ring-4" : "border-border",
				)}
			>
				<SearchNormal1 className="text-primary/70 size-5 shrink-0" variant="Outline" />
				<input
					ref={inputRef}
					type="search"
					role="combobox"
					aria-expanded={showDropdown}
					aria-controls={listId}
					aria-label="Find a client to check in"
					placeholder="Name or phone"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					onFocus={() => setIsFocused(true)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !waiting) {
							const first = clients.find((c) => !here?.has(c.id));
							if (first) {
								e.preventDefault();
								pick(first);
							}
						}
						if (e.key === "Escape") setSearchQuery("");
					}}
					className="text-foreground placeholder:text-muted-foreground h-full min-w-0 flex-1 bg-transparent text-base outline-none [&::-webkit-search-cancel-button]:hidden"
					autoComplete="off"
					enterKeyHint="go"
				/>
				{waiting && typed ? (
					<Refresh className="text-primary size-5 shrink-0 animate-spin motion-reduce:animate-none" variant="Outline" />
				) : searchQuery ? (
					<button
						type="button"
						aria-label="Clear"
						onClick={() => {
							setSearchQuery("");
							inputRef.current?.focus();
						}}
						className="hover:bg-muted -mr-1 flex size-9 items-center justify-center rounded-full transition-colors"
					>
						<CloseCircle className="text-muted-foreground size-5" variant="Outline" />
					</button>
				) : null}
			</div>

			{showDropdown ? (
				<div
					id={listId}
					className="bg-card zen-shadow-lg animate-in fade-in-0 slide-in-from-top-1 absolute top-full right-0 left-0 z-50 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border duration-150 motion-reduce:animate-none"
				>
					{clients.length === 0 ? (
						<p className="text-muted-foreground px-4 py-6 text-center text-sm">
							{waiting ? "Searching…" : `No client matches “${searchQuery.trim()}”.`}
						</p>
					) : (
						<ul className="flex flex-col gap-0.5 p-1.5">
							{clients.map((client, index) => {
								const isHere = here?.has(client.id) ?? false;
								return (
									<li key={client.id}>
										<button
											type="button"
											disabled={isHere}
											onClick={() => pick(client)}
											className={cn(
												"flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
												isHere ? "cursor-default opacity-60" : "hover:bg-muted cursor-pointer",
												index === 0 && !isHere && !waiting && "bg-muted/60",
											)}
										>
											<Avatar className="size-10">
												<AvatarImage src={client.photoUrl || undefined} />
												<AvatarFallback className="bg-primary/10 text-primary font-semibold">{client.fullName[0]}</AvatarFallback>
											</Avatar>
											<span className="flex min-w-0 flex-1 flex-col">
												<span className="flex min-w-0 items-center gap-1.5">
													<span className="text-foreground truncate font-semibold">{client.fullName}</span>
													{(client.healthLogs || []).some((l) => l.isAlert) ? (
														<Danger size={16} variant="Bold" className="text-destructive shrink-0" aria-label="Health alerts" role="img" />
													) : null}
												</span>
												<span className="truncate text-sm">
													{isHere ? (
														<span className="text-success inline-flex items-center gap-1 font-medium">
															<TickCircle size={14} variant="Bold" />
															Already here
														</span>
													) : (
														<CardAtTheDoor wallets={client.wallets} />
													)}
												</span>
											</span>
											{index === 0 && !isHere && !waiting ? (
												<kbd className="text-muted-foreground bg-card hidden rounded-md border px-1.5 py-0.5 font-sans text-xs [@media(pointer:fine)]:inline">
													Enter
												</kbd>
											) : null}
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			) : null}
		</div>
	);
}
