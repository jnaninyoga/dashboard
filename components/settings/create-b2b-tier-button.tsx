"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { Add as Plus } from "iconsax-reactjs";

import { B2BTierDialog } from "./b2b-tier-dialog";

export function CreateB2BTierButton() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<Button onClick={() => setIsOpen(true)}>
				<Plus className="mr-2 h-4 w-4" />
				New B2B Tier
			</Button>
			<B2BTierDialog open={isOpen} onOpenChange={setIsOpen} />
		</>
	);
}
