import { cn } from "@/lib/utils/ui";

// One calm tone for every placeholder: a wash of the text colour, so it
// reads on the page, on cards and on tinted panels, in light and dark.
// Decorative only: screen readers hear the loading screen's label instead.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			aria-hidden
			className={cn("bg-foreground/7 animate-pulse rounded-md motion-reduce:animate-none", className)}
			{...props}
		/>
	);
}

export { Skeleton };
