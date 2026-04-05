"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteClientAction } from "@/actions/clients/mutations";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Client } from "@/lib/types";

import { Edit2, More, Refresh, Trash } from "iconsax-reactjs";

export function ClientActions({
	client,
	showEdit = true,
}: {
	client: Client;
	showEdit?: boolean;
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const handleDelete = async () => {
		startTransition(async () => {
			const res = await deleteClientAction(client.id);
			if (res.error) {
				// toast.error(res.error); // TODO: Add toast
				console.error(res.error);
			} else {
				setShowDeleteDialog(false);
				router.push("/clients");
			}
		});
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="h-8 w-8 p-0">
						<span className="sr-only">Open menu</span>
						<More className="h-4 w-4" variant="Outline" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{showEdit ? (
						<DropdownMenuItem
							onClick={() => router.push(`/clients/${client.id}/edit`)}
						>
							<Edit2 className="mr-2 h-4 w-4 text-current" variant="Outline" />
							Edit
						</DropdownMenuItem>
					) : null}
					<DropdownMenuItem
						onClick={() => setShowDeleteDialog(true)}
						className="focus:bg-secondary text-red-600 focus:text-red-600 focus:[&_svg]:text-red-600"
					>
						<Trash className="mr-2 h-4 w-4 text-red-600" variant="Outline" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete <strong>{client.fullName}</strong>.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleDelete();
							}}
							className="bg-red-600 hover:bg-red-700"
							disabled={isPending}
						>
							{isPending ? (
								<Refresh className="mr-2 h-4 w-4 animate-spin" variant="Outline" />
							) : (
								<Trash className="mr-2 h-4 w-4" variant="Bulk" />
							)}
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
