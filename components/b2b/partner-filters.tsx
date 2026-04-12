"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export function PartnerFilters() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [_isPending, startTransition] = useTransition();

	const updateParams = (updates: Record<string, string | null>) => {
		const params = new URLSearchParams(searchParams);
		Object.entries(updates).forEach(([key, value]) => {
			if (value && value !== "all") {
				params.set(key, value);
			} else {
				params.delete(key);
			}
		});
		params.set("page", "1"); // Reset pagination

		startTransition(() => {
			router.replace(`?${params.toString()}`);
		});
	};

	const handleSearch = (term: string) => {
		updateParams({ query: term });
	};

	const handleFilterChange = (key: string, value: string) => {
		updateParams({ [key]: value });
	};

	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
			<Input
				placeholder="Search company, contact..."
				className="border-foreground/10 bg-white focus-visible:ring-primary/20 w-full font-medium transition-all sm:w-2xs"
				defaultValue={searchParams.get("query")?.toString()}
				onChange={(e) => handleSearch(e.target.value)}
			/>
			<div className="flex w-full gap-4 sm:w-auto">
				<Select
					onValueChange={(v) => handleFilterChange("docType", v)}
					defaultValue={searchParams.get("docType") || "all"}
				>
					<SelectTrigger className="border-foreground/10 focus:ring-primary/20 bg-white w-full font-semibold transition-all sm:w-48">
						<SelectValue placeholder="Document Type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Documents</SelectItem>
						<SelectItem value="quote">Quote</SelectItem>
						<SelectItem value="invoice">Invoice</SelectItem>
					</SelectContent>
				</Select>
				<Select
					onValueChange={(v) => handleFilterChange("docStatus", v)}
					defaultValue={searchParams.get("docStatus") || "all"}
				>
					<SelectTrigger className="border-foreground/10 focus:ring-primary/20 bg-white w-full font-semibold transition-all sm:w-48">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent className="border-secondary/20 rounded-xl shadow-xl">
						<SelectItem value="all" className="font-bold">
							All Statuses
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
