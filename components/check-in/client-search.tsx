"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getClientsAction } from "@/actions/clients";
import { useDebounce } from "@/hooks/use-debounce";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ClientSearch({ onSelectClient }: { onSelectClient: (client: any) => void }) {
	const [open, setOpen] = React.useState(false);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);
	const [clients, setClients] = React.useState<any[]>([]);
	const debouncedQuery = useDebounce(searchQuery, 300);

	React.useEffect(() => {
		let isMounted = true;
		async function fetchClients() {
			if (!debouncedQuery.trim() && !open) return; // Optional: don't fetch if not open
			setIsLoading(true);
            // Fetch categoryId="all" to get everyone
			const res = await getClientsAction(1, 10, debouncedQuery, { categoryId: "all" } as any);
			if (isMounted && res.success && res.data) {
				setClients(res.data);
			}
			if (isMounted) setIsLoading(false);
		}
		
		fetchClients();
		return () => { isMounted = false; };
	}, [debouncedQuery, open]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full h-14 justify-between text-lg md:text-md"
				>
					Select a client to check in...
					<Search className="ml-2 h-5 w-5 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[calc(100vw-2rem)] md:w-[600px] p-0" align="start">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search clients by name, email, or phone..."
						value={searchQuery}
						onValueChange={setSearchQuery}
						className="h-12 text-md"
					/>
					<CommandList>
						<CommandEmpty>
							{isLoading ? "Searching..." : "No clients found."}
						</CommandEmpty>
						<CommandGroup>
							{clients.map((client) => (
								<CommandItem
									key={client.id}
									value={client.id}
									onSelect={() => {
										onSelectClient(client);
										setOpen(false);
									}}
									className="py-3 px-4 cursor-pointer"
								>
									<div className="flex items-center gap-3 w-full">
										<Avatar className="h-10 w-10">
											<AvatarImage src={client.photoUrl || undefined} />
											<AvatarFallback>{client.fullName[0]}</AvatarFallback>
										</Avatar>
										<div className="flex flex-col flex-1">
											<span className="font-medium text-base">{client.fullName}</span>
											<span className="text-sm text-muted-foreground">{client.phone} • {client.email}</span>
										</div>
                                        {client.healthLogs?.some((l: any) => l.isAlert) && (
                                            <div className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                                                Alerts
                                            </div>
                                        )}
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
