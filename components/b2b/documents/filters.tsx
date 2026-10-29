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

import { DocumentStatusBadge } from "./status-badge";

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

	const handleBackorderChange = (value: string) => {
		const newQueryString = createQueryString("isBackorder", value);
		if (newQueryString === searchParams.toString()) return;

		startTransition(() => {
			router.replace(`${pathname}?${newQueryString}`, { scroll: false });
		});
	};

	return (
		<div className="flex min-w-0 flex-1 flex-col gap-3 xl:flex-row xl:items-center">
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
			{/* Three equal, shrinkable columns on phones (the row of fixed-width
			    selects used to push the page sideways); a row from sm up. */}
			<div className="grid grid-cols-3 gap-2 xl:flex xl:items-center">
				<Select
					defaultValue={searchParams.get("type") || "all"}
					onValueChange={handleTypeChange}
					disabled={isPending}
				>
					<SelectTrigger className="focus:ring-primary/20 bg-card w-full min-w-0 border transition-all xl:w-44">
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
					<SelectTrigger className="focus:ring-primary/20 bg-card w-full min-w-0 border transition-all xl:w-44">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent className="border shadow-xl">
						<SelectItem value="all">
							All Status
						</SelectItem>
						<SelectItem value="owed">Owed (any unpaid invoice)</SelectItem>
						<SelectItem value="draft">
							<DocumentStatusBadge status="draft" />
						</SelectItem>
						<SelectItem value="sent">
							<DocumentStatusBadge status="sent" />
						</SelectItem>
						<SelectItem value="accepted">
							<DocumentStatusBadge status="accepted" />
						</SelectItem>
						<SelectItem value="unpaid">
							<DocumentStatusBadge status="unpaid" />
						</SelectItem>
						<SelectItem value="partially_paid">
							<DocumentStatusBadge status="partially_paid" />
						</SelectItem>
						<SelectItem value="paid">
							<DocumentStatusBadge status="paid" />
						</SelectItem>
						<SelectItem value="cancelled">
							<DocumentStatusBadge status="cancelled" />
						</SelectItem>
					</SelectContent>
				</Select>

				<Select
					defaultValue={searchParams.get("isBackorder") || "all"}
					onValueChange={handleBackorderChange}
					disabled={isPending}
				>
					<SelectTrigger className="focus:ring-primary/20 bg-card w-full min-w-0 border transition-all xl:w-44">
						<SelectValue placeholder="Backorder" />
					</SelectTrigger>
					<SelectContent className="border shadow-xl">
						<SelectItem value="all">
							All Documents
						</SelectItem>
						<SelectItem value="true">
							<Badge
								variant="outline"
								className="border-purple-500 px-2 py-0.5 text-[10px] font-bold tracking-widest text-purple-600 uppercase"
							>
								Backorders Only
							</Badge>
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
