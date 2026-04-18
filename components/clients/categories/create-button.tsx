"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { AddCircle } from "iconsax-reactjs";

import { CategoryDialog } from "./dialog";

export function CreateCategoryButton() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<Button
				className="shadow-sm zen-glow-teal h-11 px-8 font-bold transition-all"
				onClick={() => setIsOpen(true)}
			>
				<AddCircle className="mr-2 size-4" variant="Bold" />
				New Category
			</Button>
			<CategoryDialog open={isOpen} onOpenChange={setIsOpen} />
		</>
	);
}
