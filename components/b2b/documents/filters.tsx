"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/lib/hooks/use-debounce";

import { SearchNormal1 } from "iconsax-reactjs";

export function DocumentFilters() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	const createQueryString = useCallback(
		(name: string, value: string) => {
			const params = new URLSearchParams(searchParams.toString());
			if (value === "all" || !value) {
				params.delete(name);
			} else {
				params.set(name, value);
			}
			return params.toString();
		},
		[searchParams],
	);

	const handleSearch = useDebounce((term: string) => {
		const newQueryString = createQueryString("query", term);
		if (newQueryString === searchParams.toString()) return;

		startTransition(() => {
			router.replace(`${pathname}?${newQueryString}`, { scroll: false });
		});
	}, 300);

	const handleTypeChange = (value: string) => {
		const newQueryString = createQueryString("type", value);
		if (newQueryString === searchParams.toString()) return;

		startTransition(() => {
			router.replace(`${pathname}?${newQueryString}`, { scroll: false });
		});
	};

	const handleStatusChange = (value: string) => {
		const newQueryString = createQueryString("status", value);
		if (newQueryString === searchParams.toString()) return;

		startTransition(() => {
			router.replace(`${pathname}?${newQueryString}`, { scroll: false });
		});
	};

	return (
		<div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
			<div className="relative flex-1">
				<SearchNormal1
					size={18}
					className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
				/>
				<Input
					placeholder="Search documents..."
					className="focus-visible:ring-primary/20 bg-card h-10 border pl-10 font-medium transition-all"
					defaultValue={searchParams.get("query")?.toString()}
					onChange={(e) => handleSearch(e.target.value)}
					disabled={isPending}
				/>
			</div>
			<div className="flex items-center gap-2">
				<Select
					defaultValue={searchParams.get("type") || "all"}
					onValueChange={handleTypeChange}
					disabled={isPending}
				>
					<SelectTrigger className="focus:ring-primary/20 bg-card w-full border transition-all sm:w-48">
						<SelectValue placeholder="Type" />
					</SelectTrigger>
					<SelectContent className="border shadow-xl">
						<SelectItem value="all">
							All Types
						</SelectItem>
						<SelectItem value="quote">
							Quotes
						</SelectItem>
						<SelectItem value="invoice">
							Invoices
						</SelectItem>
					</SelectContent>
				</Select>

				<Select
					defaultValue={searchParams.get("status") || "all"}
					onValueChange={handleStatusChange}
					disabled={isPending}
				>
					<SelectTrigger className="focus:ring-primary/20 bg-card w-full border transition-all sm:w-48">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent className="border shadow-xl">
						<SelectItem value="all">
							All Status
						</SelectItem>
						<SelectItem value="draft">
							<Badge
								variant="muted"
								className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase"
							>
								Draft
							</Badge>
						</SelectItem>
						<SelectItem value="sent">
							<Badge
								variant="info"
								className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase"
							>
								Sent
							</Badge>
						</SelectItem>
						<SelectItem value="accepted">
							<Badge
								variant="success"
								className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase"
							>
								Accepted
							</Badge>
						</SelectItem>
						<SelectItem value="paid">
							<Badge
								variant="success"
								className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase"
							>
								Paid
							</Badge>
						</SelectItem>
						<SelectItem value="cancelled">
							<Badge
								variant="destructive"
								className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase"
							>
								Cancelled
							</Badge>
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
