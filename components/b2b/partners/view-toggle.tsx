"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { View } from "@/lib/types";

import { Grid7 as Grid, RowVertical as List } from "iconsax-reactjs";

export function PartnerViewToggle() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const view = (searchParams.get("view") as View) || View.GRID;

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
			className="bg-card inline-flex gap-1 rounded-2xl p-1 shadow-sm"
		>
			<ToggleGroupItem
				value={View.LIST.toString()}
				aria-label="Table View"
				className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=off]:text-secondary-foreground hover:data-[state=off]:bg-background h-9 w-9 rounded-xl p-0"
			>
				<List size={18} variant={view === View.LIST ? "Bulk" : "Outline"} />
			</ToggleGroupItem>
			<ToggleGroupItem
				value={View.GRID.toString()}
				aria-label="Grid View"
				className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=off]:text-secondary-foreground hover:data-[state=off]:bg-background h-9 w-9 rounded-xl p-0"
			>
				<Grid size={18} variant={view === View.GRID ? "Bulk" : "Outline"} />
			</ToggleGroupItem>
		</ToggleGroup>
	);
}
