"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { View } from "@/lib/types";

import { Grid7 as Grid, RowVertical as List } from "iconsax-reactjs";

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
			className="hidden gap-1 rounded-2xl bg-white p-1 shadow-sm md:inline-flex"
		>
			<ToggleGroupItem
				value={View.LIST.toString()}
				aria-label="Table View"
				className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=off]:text-secondary-foreground hover:data-[state=off]:bg-background rounded-xl"
			>
				<List className="h-4 w-4" variant={view === View.LIST ? "Bulk" : "Outline"} />
			</ToggleGroupItem>
			<ToggleGroupItem
				value={View.GRID.toString()}
				aria-label="Grid View"
				className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=off]:text-secondary-foreground hover:data-[state=off]:bg-background rounded-xl"
			>
				<Grid className="h-4 w-4" variant={view === View.GRID ? "Bulk" : "Outline"} />
			</ToggleGroupItem>
		</ToggleGroup>
	);
}
