"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { Add, AddCircle } from "iconsax-reactjs";

import { B2BTierDialog } from "./dialog";

export function CreateB2BTierButton() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<Button
				onClick={() => setIsOpen(true)}
				className="shadow-sm zen-glow-teal h-11 px-8 font-bold transition-all"
			>
				<AddCircle className="mr-2 h-4 w-4" variant="Bold" />
				New B2B Tier
			</Button>
			<B2BTierDialog open={isOpen} onOpenChange={setIsOpen} />
		</>
	);
}
