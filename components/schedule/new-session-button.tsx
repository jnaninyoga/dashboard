"use client";

import { useQuickActions } from "@/components/quick-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/ui";

import { Add } from "iconsax-reactjs";

/** Opens the one session sheet the quick actions use (it refreshes the page when saved). */
export function NewSessionButton({ className }: { className?: string }) {
	const { openNewSession } = useQuickActions();
	return (
		<Button
			onClick={openNewSession}
			className={cn("zen-glow-teal min-h-11 gap-2 rounded-full px-5 font-semibold", className)}
		>
			<Add size={20} className="size-5" />
			New session
		</Button>
	);
}
