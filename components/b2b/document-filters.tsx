"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { B2BDocumentStatus, B2BDocumentType } from "@/lib/types/b2b";

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
					className="border-foreground/10 focus-visible:ring-primary/20 bg-white h-10 pl-10 transition-all font-medium"
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
					<SelectTrigger className="border-foreground/10 focus:ring-primary/20 w-[140px] bg-white font-bold transition-all uppercase text-[10px] tracking-widest">
						<SelectValue placeholder="Type" />
					</SelectTrigger>
					<SelectContent className="border-foreground/10 shadow-xl">
						<SelectItem
							value="all"
							className="text-[10px] font-bold tracking-widest uppercase"
						>
							All Types
						</SelectItem>
						<SelectItem
							value="quote"
							className="text-[10px] font-bold tracking-widest uppercase"
						>
							Quotes
						</SelectItem>
						<SelectItem
							value="invoice"
							className="text-[10px] font-bold tracking-widest uppercase"
						>
							Invoices
						</SelectItem>
					</SelectContent>
				</Select>

				<Select
					defaultValue={searchParams.get("status") || "all"}
					onValueChange={handleStatusChange}
					disabled={isPending}
				>
					<SelectTrigger className="border-foreground/10 focus:ring-primary/20 w-[140px] bg-white font-bold transition-all uppercase text-[10px] tracking-widest">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent className="border-foreground/10 shadow-xl">
						<SelectItem
							value="all"
							className="text-[10px] font-bold tracking-widest uppercase"
						>
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
