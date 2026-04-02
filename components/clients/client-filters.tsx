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
import { type Category, Gender } from "@/lib/types";

interface ClientFiltersProps {
    categories: Category[];
}

export function ClientFilters({ categories }: ClientFiltersProps) {
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
		if (value && value !== "all" && value !== Gender.ALL) {
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
				className="w-full sm:w-[300px] bg-white"
				defaultValue={searchParams.get("query")?.toString()}
				onChange={(e) => handleSearch(e.target.value)}
			/>
			<div className="flex w-full gap-4 sm:w-auto">
				<Select
					onValueChange={(v) => handleFilterChange("categoryId", v)}
					defaultValue={searchParams.get("categoryId") || "all"}
				>
					<SelectTrigger className="w-full sm:w-[180px] bg-white">
						<SelectValue placeholder="Category" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                            </SelectItem>
                        ))}
					</SelectContent>
				</Select>
				<Select
					onValueChange={(v) => handleFilterChange("gender", v)}
					defaultValue={searchParams.get("gender") || Gender.ALL}
				>
					<SelectTrigger className="w-full sm:w-[180px] bg-white">
						<SelectValue placeholder="Gender" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={Gender.ALL}>All Genders</SelectItem>
						<SelectItem value={Gender.MALE}>Male</SelectItem>
						<SelectItem value={Gender.FEMALE}>Female</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
