"use client";

import { useState } from "react";

import { useConfirm } from "@/components/feedback/confirm";
import { ProductSheet } from "@/components/price-list/product-sheet";
import { RowActionsTrigger } from "@/components/row-actions-trigger";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteProductAction, setProductArchivedAction } from "@/lib/actions/price-list";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { type Product } from "@/lib/types";

import {
	AddCircle,
	ArchiveBook as Archive,
	Edit2 as Edit,
	Trash,
} from "iconsax-reactjs";

export function MembershipActions({ product }: { product: Product }) {
	const [isEditOpen, setIsEditOpen] = useState(false);

	const confirm = useConfirm();

	const handleArchive = async () => {
		const ok = await confirm({
			title: `Archive ${product.name}?`,
			description: "It will be hidden from new sales.",
			confirmLabel: "Archive",
		});
		if (!ok) return;
		const result = await setProductArchivedAction(product.id, true);
		if (result.success) notify.success("Membership archived");
		else notifyActionError(result, "Couldn't archive this membership");
	};

	const handleDelete = async () => {
		const ok = await confirm({
			title: `Delete ${product.name} permanently?`,
			description: "This can't be undone. Archive it instead if cards were sold with it.",
			confirmLabel: "Delete",
			destructive: true,
		});
		if (!ok) return;
		const result = await deleteProductAction(product.id);
		if (result.success) notify.success("Membership deleted");
		else notifyActionError(result, "Couldn't delete this membership");
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<RowActionsTrigger label={`Actions for ${product.name}`} />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>Actions</DropdownMenuLabel>
					<DropdownMenuItem onClick={() => setIsEditOpen(true)}>
						<Edit className="mr-2 h-4 w-4" />
						Edit
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={handleArchive}>
						<Archive className="mr-2 h-4 w-4" />
						Archive
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={handleDelete}
						className="focus:bg-secondary text-destructive focus:text-destructive focus:[&_svg]:text-destructive"
					>
						<Trash className="text-destructive mr-2 h-4 w-4" variant="Outline" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<ProductSheet kind="membership" open={isEditOpen} onOpenChange={setIsEditOpen} product={product} />
		</>
	);
}

export function CreateMembershipDialog() {
	const [open, setOpen] = useState(false);
	return (
		<ProductSheet
			kind="membership"
			open={open}
			onOpenChange={setOpen}
			trigger={
				<Button className="zen-glow-teal h-11 px-8 font-bold shadow-sm transition-all">
					<AddCircle variant="Bold" className="mr-2 size-4" />
					New Membership
				</Button>
			}
		/>
	);
}
