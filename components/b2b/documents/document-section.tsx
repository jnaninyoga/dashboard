import { cn } from "@/lib/utils/ui";

/**
 * A part of a document (its lines, its notes): named on the page itself,
 * with its save status and action on the right, then one container holding
 * it. Every part of a document is laid out the same way.
 */
export function DocumentSection({
	id,
	title,
	aside,
	className,
	children,
}: {
	/** Names the heading, which names the section for screen readers. */
	id: string;
	title: string;
	/** Save status, an action. */
	aside?: React.ReactNode;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<section
			aria-labelledby={`${id}-title`}
			className={cn("space-y-3", className)}
		>
			<div className="flex min-h-10 flex-wrap items-center justify-between gap-x-3 gap-y-2">
				<h2
					id={`${id}-title`}
					className="font-heading text-foreground text-lg font-semibold"
				>
					{title}
				</h2>
				{aside ? <div className="flex items-center gap-3">{aside}</div> : null}
			</div>
			{children}
		</section>
	);
}
