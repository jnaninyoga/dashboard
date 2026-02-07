"use client";

import { LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useRouter, useSearchParams } from "next/navigation";

export function ClientViewToggle() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const view = searchParams.get("view") || "table";

	const handleViewChange = (v: string) => {
		if (!v) return;
		const params = new URLSearchParams(searchParams);
		params.set("view", v);
		router.replace(`?${params.toString()}`);
	};

	return (
		<ToggleGroup
			type="single"
			value={view}
			onValueChange={handleViewChange}
			className="hidden md:inline-flex"
		>
			<ToggleGroupItem value="table" aria-label="Table View">
				<List className="h-4 w-4" />
			</ToggleGroupItem>
			<ToggleGroupItem value="grid" aria-label="Grid View">
				<LayoutGrid className="h-4 w-4" />
			</ToggleGroupItem>
		</ToggleGroup>
	);
}
