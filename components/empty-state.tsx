import { cn } from "@/lib/utils/ui";

/**
 * The one "nothing here yet" block: same look for every list, with an
 * optional next step (e.g. a "New quotation" button).
 */
export function EmptyState({
	icon,
	title,
	description,
	action,
	className,
}: {
	icon: React.ReactNode;
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"group border-foreground/10 bg-card/80 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-14 text-center sm:py-20",
				className,
			)}
		>
			<div className="border-primary/15 bg-primary/10 text-primary/80 zen-glow-teal mb-4 rounded-2xl border p-5 shadow-sm">
				{icon}
			</div>
			<h3 className="font-heading text-foreground text-xl font-bold">{title}</h3>
			{description ? (
				<p className="text-muted-foreground mt-2 max-w-md text-sm">{description}</p>
			) : null}
			{action ? <div className="mt-6">{action}</div> : null}
		</div>
	);
}
