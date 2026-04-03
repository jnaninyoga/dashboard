"use client";

import * as React from "react";

import { getClientsAction } from "@/actions/clients";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type Client, type HealthLog } from "@/drizzle/schema";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

import { CloseCircle,Refresh, SearchNormal1 } from "iconsax-reactjs";

export function ClientSearch({ onSelectClient }: { onSelectClient: (client: Client & { healthLogs?: HealthLog[] }) => void }) {
	const [searchQuery, setSearchQuery] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);
	const [clients, setClients] = React.useState<(Client & { healthLogs?: HealthLog[] })[]>([]);
	const [isFocused, setIsFocused] = React.useState(false);
	const debouncedQuery = useDebounce(searchQuery, 300);
	const inputRef = React.useRef<HTMLInputElement>(null);
	const containerRef = React.useRef<HTMLDivElement>(null);

	// Close dropdown on outside click
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
		async function fetchClients() {
			if (!debouncedQuery.trim() && !isFocused) return;
			setIsLoading(true);
			const res = await getClientsAction(1, 10, debouncedQuery, { categoryId: "all" });
			if (isMounted && res.success && res.data) {
				setClients(res.data);
			}
			if (isMounted) setIsLoading(false);
		}
		
		fetchClients();
		return () => { isMounted = false; };
	}, [debouncedQuery, isFocused]);

	const showDropdown = isFocused && (clients.length > 0 || isLoading || searchQuery.trim().length > 0);

	return (
		<div ref={containerRef} className="relative w-full">
			{/* Single search input — no double-click needed */}
			<div className={cn(
				"bg-card flex min-h-[56px] w-full items-center gap-3 rounded-2xl px-5 transition-all duration-200",
				isFocused
					? "zen-shadow-md ring-primary/20 ring-2"
					: "zen-shadow-glow hover:zen-shadow-md"
			)}>
				<SearchNormal1 className="text-primary/60 size-5 shrink-0" variant="Outline" />
				<input
					ref={inputRef}
					type="text"
					placeholder="Search clients to check in..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					onFocus={() => setIsFocused(true)}
					className="text-foreground placeholder:text-muted-foreground h-full flex-1 bg-transparent text-base outline-none"
					autoComplete="off"
				/>
				{searchQuery ? (
					<button
						type="button"
						onClick={() => { setSearchQuery(""); inputRef.current?.focus(); }}
						className="hover:bg-muted flex size-8 items-center justify-center rounded-full transition-colors"
					>
						<CloseCircle className="text-muted-foreground size-5" variant="Outline" />
					</button>
				) : null}
				{isLoading ? (
					<Refresh className="text-primary size-5 shrink-0 animate-spin" variant="Outline" />
				) : null}
			</div>

			{/* Results dropdown */}
			{showDropdown ? (
				<div className="bg-card zen-shadow-lg animate-slide-up absolute top-full right-0 left-0 z-50 mt-2 max-h-[60vh] overflow-hidden overflow-y-auto rounded-2xl">
					{clients.length === 0 && !isLoading ? (
						<div className="text-muted-foreground py-8 text-center text-sm">
							No clients found.
						</div>
					) : (
						<div className="flex flex-col gap-0.5 p-2">
							{clients.map((client) => (
								<button
									key={client.id}
									type="button"
									onClick={() => {
										onSelectClient(client);
										setSearchQuery("");
										setIsFocused(false);
									}}
									className="hover:bg-muted flex min-h-[56px] w-full cursor-pointer items-center gap-3 rounded-xl p-3.5 text-left transition-colors"
								>
									<Avatar className="size-10">
										<AvatarImage src={client.photoUrl || undefined} />
										<AvatarFallback className="bg-primary/10 text-primary font-semibold">{client.fullName[0]}</AvatarFallback>
									</Avatar>
									<div className="flex min-w-0 flex-1 flex-col">
										<span className="text-foreground truncate text-base font-semibold">{client.fullName}</span>
										<span className="text-muted-foreground truncate text-sm">{client.phone} • {client.email}</span>
									</div>
									{(client.healthLogs || []).some((l) => l.isAlert) ? (
										<div className="shrink-0 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
											Alerts
										</div>
									) : null}
								</button>
							))}
						</div>
					)}
				</div>
			) : null}
		</div>
	);
}
