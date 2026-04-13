"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { Add as Plus } from "iconsax-reactjs";

import { CategoryDialog } from "./dialog";

export function CreateCategoryButton() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<Button onClick={() => setIsOpen(true)}>
				<Plus className="mr-2 h-4 w-4" />
				New Category
			</Button>
			<CategoryDialog open={isOpen} onOpenChange={setIsOpen} />
		</>
	);
}
