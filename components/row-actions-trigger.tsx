"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/ui";

import { More } from "iconsax-reactjs";

/**
 * The "⋮" button that opens a row's or card's actions menu. One look and one
 * size everywhere (40px on phones, a comfortable tap), with a label that says
 * whose actions they are. Use inside <DropdownMenuTrigger asChild>.
 */
export function RowActionsTrigger({
	label,
	className,
	...props
}: React.ComponentProps<typeof Button> & { label: string }) {
	return (
		<Button
			variant="ghost"
			size="icon"
			aria-label={label}
			className={cn(
				"text-muted-foreground hover:bg-secondary/40 hover:text-foreground size-10 shrink-0 rounded-xl md:size-9",
				className,
			)}
			{...props}
		>
			{/* "size-auto" opts out of the Button's 16px icon rule, so size={18} applies. */}
			<More size={18} className="size-auto rotate-90" />
		</Button>
	);
}
