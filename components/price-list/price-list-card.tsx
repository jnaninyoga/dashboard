"use client";

import { useConfirm } from "@/components/feedback/confirm";
import { RowActionsTrigger } from "@/components/row-actions-trigger";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { cn } from "@/lib/utils/ui";

import { ArchiveBook, Edit2, RotateLeft, Trash } from "iconsax-reactjs";

type Result = { success?: boolean; error?: string; ref?: string };

/** The picture of an item of her price list: its kind's icon on a soft tile. */
export function PriceListTile({ icon, tone = "teal" }: { icon: React.ReactNode; tone?: "teal" | "blush" }) {
	return (
		<div
			className={cn(
				"flex size-14 items-center justify-center rounded-2xl",
				tone === "teal" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground",
			)}
		>
			{icon}
		</div>
	);
}

/**
 * The ⋮ menu of an item on sale: change it, take it off sale (what was sold
 * keeps it), or delete it, which the server refuses once it was sold.
 */
export function PriceListMenu({
	name,
	noun,
	onEdit,
	archive,
	remove,
}: {
	name: string;
	/** "membership", "rate", "discount". */
	noun: string;
	onEdit: () => void;
	archive: () => Promise<Result>;
	remove: () => Promise<Result>;
}) {
	const confirm = useConfirm();

	const run = async (action: () => Promise<Result>, done: string) => {
		const result = await action();
		if (result.success) notify.success(done);
		else notifyActionError(result, "Couldn't change it");
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<RowActionsTrigger label={`Actions for ${name}`} />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={onEdit}>
					<Edit2 className="mr-2 size-4" />
					Edit
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={async () => {
						const ok = await confirm({
							title: `Archive ${name}?`,
							description: `It's no longer offered. What was sold with it keeps it, and you can put it back.`,
							confirmLabel: "Archive",
						});
						if (ok) await run(archive, `${name} archived`);
					}}
				>
					<ArchiveBook className="mr-2 size-4" />
					Archive
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="text-destructive focus:text-destructive focus:[&_svg]:text-destructive"
					onClick={async () => {
						const ok = await confirm({
							title: `Delete ${name}?`,
							description: `This can't be undone. A ${noun} already used can only be archived.`,
							confirmLabel: "Delete",
							destructive: true,
						});
						if (ok) await run(remove, `${name} deleted`);
					}}
				>
					<Trash className="text-destructive mr-2 size-4" variant="Outline" />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/** What she no longer offers, quietly under the list, each with a way back. */
export function ArchivedShelf<T extends { id: string; name: string }>({
	items,
	describe,
	restore,
}: {
	items: T[];
	describe: (item: T) => React.ReactNode;
	restore: (item: T) => Promise<Result>;
}) {
	if (!items.length) return null;
	return (
		<section aria-labelledby="archived-title" className="grid gap-3">
			<h2 id="archived-title" className="font-heading text-muted-foreground text-lg font-semibold">
				Archived
			</h2>
			<ul className="bg-card divide-border divide-y rounded-2xl border">
				{items.map((item) => (
					<li key={item.id} className="flex items-center gap-3 px-4 py-3">
						<div className="min-w-0 flex-1">
							<p className="text-muted-foreground truncate font-medium">{item.name}</p>
							<p className="text-muted-foreground/80 text-sm">{describe(item)}</p>
						</div>
						<Button
							variant="ghost"
							className="h-10 rounded-xl"
							onClick={async () => {
								const result = await restore(item);
								if (result.success) notify.success(`${item.name} is offered again`);
								else notifyActionError(result, "Couldn't put it back");
							}}
						>
							<RotateLeft className="mr-2 size-4" />
							Put back
						</Button>
					</li>
				))}
			</ul>
		</section>
	);
}
