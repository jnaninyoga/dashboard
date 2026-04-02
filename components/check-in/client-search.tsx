"use client";

import * as React from "react";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getClientsAction } from "@/actions/clients";
import { useDebounce } from "@/hooks/use-debounce";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ClientSearch({ onSelectClient }: { onSelectClient: (client: any) => void }) {
	const [searchQuery, setSearchQuery] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);
	const [clients, setClients] = React.useState<any[]>([]);
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
			const res = await getClientsAction(1, 10, debouncedQuery, { categoryId: "all" } as any);
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
				"flex items-center gap-3 min-h-[56px] w-full rounded-2xl bg-card px-5 transition-all duration-200",
				isFocused
					? "zen-shadow-md ring-2 ring-primary/20"
					: "zen-shadow-glow hover:zen-shadow-md"
			)}>
				<Search className="size-5 text-primary/60 shrink-0" />
				<input
					ref={inputRef}
					type="text"
					placeholder="Search clients to check in..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					onFocus={() => setIsFocused(true)}
					className="flex-1 h-full bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none"
					autoComplete="off"
				/>
				{searchQuery && (
					<button
						type="button"
						onClick={() => { setSearchQuery(""); inputRef.current?.focus(); }}
						className="size-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
					>
						<X className="size-4 text-muted-foreground" />
					</button>
				)}
				{isLoading && (
					<Loader2 className="size-5 text-primary animate-spin shrink-0" />
				)}
			</div>

			{/* Results dropdown */}
			{showDropdown && (
				<div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl zen-shadow-lg z-50 overflow-hidden animate-slide-up max-h-[60vh] overflow-y-auto">
					{clients.length === 0 && !isLoading ? (
						<div className="py-8 text-center text-muted-foreground text-sm">
							No clients found.
						</div>
					) : (
						<div className="p-2 flex flex-col gap-0.5">
							{clients.map((client) => (
								<button
									key={client.id}
									type="button"
									onClick={() => {
										onSelectClient(client);
										setSearchQuery("");
										setIsFocused(false);
									}}
									className="flex items-center gap-3 w-full p-3.5 rounded-xl hover:bg-muted transition-colors text-left min-h-[56px] cursor-pointer"
								>
									<Avatar className="size-10">
										<AvatarImage src={client.photoUrl || undefined} />
										<AvatarFallback className="bg-primary/10 text-primary font-semibold">{client.fullName[0]}</AvatarFallback>
									</Avatar>
									<div className="flex flex-col flex-1 min-w-0">
										<span className="font-semibold text-base text-foreground truncate">{client.fullName}</span>
										<span className="text-sm text-muted-foreground truncate">{client.phone} • {client.email}</span>
									</div>
									{client.healthLogs?.some((l: any) => l.isAlert) && (
										<div className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full shrink-0">
											Alerts
										</div>
									)}
								</button>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
