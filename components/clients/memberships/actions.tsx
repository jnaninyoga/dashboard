"use client";

import { useState } from "react";

import { MembershipForm } from "@/components/clients/memberships/form";
import { useConfirm } from "@/components/feedback/confirm";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	archiveMembershipProduct,
	deleteMembershipProduct,
} from "@/lib/actions/clients/memberships";
import { notify } from "@/lib/feedback/notify";

import {
	AddCircle,
	ArchiveBook as Archive,
	Edit2 as Edit,
	More,
	Trash,
} from "iconsax-reactjs";

type Product = {
	id: string;
	name: string;
	basePrice: string;
	description?: string;
	defaultCredits: number;
	durationMonths: number | null;
	isArchived: boolean;
};

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
		try {
			await archiveMembershipProduct(product.id);
			notify.success("Membership archived");
		} catch (error) {
			notify.error("Couldn't archive this membership", { error });
		}
	};

	const handleDelete = async () => {
		const ok = await confirm({
			title: `Delete ${product.name} permanently?`,
			description: "This can't be undone. Archive it instead if cards were sold with it.",
			confirmLabel: "Delete",
			destructive: true,
		});
		if (!ok) return;
		try {
			await deleteMembershipProduct(product.id);
			notify.success("Membership deleted");
		} catch (error) {
			notify.error("Couldn't delete this membership", { error });
		}
	};

	return (
		<>
			<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<More className="h-4 w-4" />
						</Button>
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
							className="focus:bg-secondary text-red-600 focus:text-red-600 focus:[&_svg]:text-red-600"
						>
							<Trash className="mr-2 h-4 w-4 text-red-600" variant="Outline" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Product</DialogTitle>
						<DialogDescription>
							Make changes to your membership product.
						</DialogDescription>
					</DialogHeader>
					<MembershipForm
						initialData={product}
						onSuccess={() => setIsEditOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
}

export function MembershipFormWrapper() {
	// This component is rendered inside the "Create" Dialog in the server page.
	// We need a way to close that dialog.
	// Since the Dialog state in the server page is controlled by Radix UI primitive (uncontrolled),
	// we can use a primitive `DialogClose` or just use the `onSuccess` to trigger a revalidation (which creates does)
	// but we can't easily close the parent dialog if it's uncontrolled.
	// So the server page should probably make the "Create" dialog a client component too.

	// I will refactor this to not be used directly, and instead update the Page to use a Client Component for the "Create" button+dialog.
	return null;
}

export function CreateMembershipDialog() {
	const [open, setOpen] = useState(false);
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="zen-glow-teal h-11 px-8 font-bold shadow-sm transition-all">
					<AddCircle variant="Bold" className="mr-2 size-4" />
					New Product
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Membership Product</DialogTitle>
					<DialogDescription>
						Add a new product to your catalog.
					</DialogDescription>
				</DialogHeader>
				<MembershipForm onSuccess={() => setOpen(false)} />
			</DialogContent>
		</Dialog>
	);
}
