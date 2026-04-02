"use client";

import { LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useRouter, useSearchParams } from "next/navigation";
import { View } from "@/lib/types";

export function ClientViewToggle() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const view = searchParams.get("view") as View || View.GRID;

	const handleViewChange = (v: View) => {
		if (!v) return;
		const params = new URLSearchParams(searchParams);
		params.set("view", v.toString());
		router.replace(`?${params.toString()}`);
	};

	return (
		<ToggleGroup
			type="single"
			value={view.toString()}
			onValueChange={handleViewChange}
			spacing={1}
			className="hidden md:inline-flex bg-white rounded-2xl shadow-sm p-1 gap-1"
		>
			<ToggleGroupItem
				value={View.LIST.toString()}
				aria-label="Table View"
				className="rounded-xl data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=off]:text-secondary-foreground hover:data-[state=off]:bg-background"
			>
				<List className="h-4 w-4" />
			</ToggleGroupItem>
			<ToggleGroupItem
				value={View.GRID.toString()}
				aria-label="Grid View"
				className="rounded-xl data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=off]:text-secondary-foreground hover:data-[state=off]:bg-background"
			>
				<LayoutGrid className="h-4 w-4" />
			</ToggleGroupItem>
		</ToggleGroup>
	);
}
