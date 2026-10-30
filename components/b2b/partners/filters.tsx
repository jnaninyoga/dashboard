"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { DocumentStatusBadge } from "@/components/b2b/documents/status-badge";
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
		<div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
			<Input
				placeholder="Search company, contact..."
				className="focus-visible:ring-primary/20 bg-card w-full border font-medium transition-all sm:w-64 xl:w-2xs"
				defaultValue={searchParams.get("query")?.toString()}
				onChange={(e) => handleSearch(e.target.value)}
			/>
			<div className="flex w-full gap-3 sm:w-auto">
				<Select
					onValueChange={(v) => handleFilterChange("docType", v)}
					defaultValue={searchParams.get("docType") || "all"}
				>
					<SelectTrigger className="focus:ring-primary/20 bg-card w-full border transition-all sm:w-40 xl:w-48">
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
					<SelectTrigger className="focus:ring-primary/20 bg-card w-full border transition-all sm:w-40 xl:w-48">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent className="border-secondary/20 rounded-xl shadow-xl">
						<SelectItem value="all" className="font-bold">
							Any status
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
			</div>
		</div>
	);
}
