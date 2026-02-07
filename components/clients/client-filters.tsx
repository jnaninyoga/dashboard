"use client";

import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function ClientFilters() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	const handleSearch = (term: string) => {
		const params = new URLSearchParams(searchParams);
		if (term) {
			params.set("query", term);
		} else {
			params.delete("query");
		}
		params.set("page", "1"); // Reset pagination
		startTransition(() => {
			router.replace(`?${params.toString()}`);
		});
	};

	const handleFilterChange = (key: string, value: string) => {
		const params = new URLSearchParams(searchParams);
		if (value && value !== "all") {
			params.set(key, value);
		} else {
			params.delete(key);
		}
		params.set("page", "1");
		startTransition(() => {
			router.replace(`?${params.toString()}`);
		});
	};

	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
			<Input
				placeholder="Search clients..."
				className="w-full sm:w-[300px]"
				defaultValue={searchParams.get("query")?.toString()}
				onChange={(e) => handleSearch(e.target.value)}
			/>
			<div className="flex w-full gap-4 sm:w-auto">
				<Select
					onValueChange={(v) => handleFilterChange("category", v)}
					defaultValue={searchParams.get("category") || "all"}
				>
					<SelectTrigger className="w-full sm:w-[180px]">
						<SelectValue placeholder="Category" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Categories</SelectItem>
						<SelectItem value="adult">Adult</SelectItem>
						<SelectItem value="child">Child</SelectItem>
						<SelectItem value="student">Student</SelectItem>
					</SelectContent>
				</Select>
				<Select
					onValueChange={(v) => handleFilterChange("gender", v)}
					defaultValue={searchParams.get("gender") || "all"}
				>
					<SelectTrigger className="w-full sm:w-[180px]">
						<SelectValue placeholder="Gender" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Genders</SelectItem>
						<SelectItem value="male">Male</SelectItem>
						<SelectItem value="female">Female</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
