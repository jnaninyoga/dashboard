"use client";

import { useState } from "react";

import { ProductSheet } from "@/components/price-list/product-sheet";
import { Button } from "@/components/ui/button";

import { AddCircle } from "iconsax-reactjs";

export function CreateB2BTierButton() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<ProductSheet
			kind="partner_service"
			open={isOpen}
			onOpenChange={setIsOpen}
			trigger={
				<Button className="zen-glow-teal h-11 px-8 font-bold shadow-sm transition-all">
					<AddCircle className="mr-2 h-4 w-4" variant="Bold" />
					New rate
				</Button>
			}
		/>
	);
}
