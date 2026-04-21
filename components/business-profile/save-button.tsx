"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/ui";

import { Refresh,TickCircle } from "iconsax-reactjs";

interface SaveProfileButtonProps {
	className?: string;
}

export function SaveProfileButton({ className }: SaveProfileButtonProps) {
	const { pending } = useFormStatus();

	return (
		<Button
			type="submit"
			disabled={pending}
			size="lg"
			className={cn(
				"zen-glow-teal h-11 px-8 font-bold transition-all",
				className,
			)}
		>
			{pending ? (
				<Refresh className="mr-2 h-4 w-4 animate-spin" />
			) : (
				<TickCircle className="mr-2 h-4 w-4" variant="Bold" />
			)}
			{pending ? "Persisting Changes..." : "Save Business Profile"}
		</Button>
	);
}
