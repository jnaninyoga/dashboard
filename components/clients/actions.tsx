"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { RowActionsTrigger } from "@/components/row-actions-trigger";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteClientAction } from "@/lib/actions/clients/mutations";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { type Client } from "@/lib/types";

import { Edit2, Refresh, Sms, Trash } from "iconsax-reactjs";

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
				notifyActionError(res, "Couldn't delete the client");
			} else {
				setShowDeleteDialog(false);
				notify.success(`${client.fullName} deleted`);
				router.push("/clients");
			}
		});
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<RowActionsTrigger label={`Actions for ${client.fullName}`} />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{showEdit ? (
						<DropdownMenuItem
							onClick={() => router.push(`/clients/${client.id}/edit`)}
						>
							<Edit2 className="mr-2 size-4 text-current" variant="Outline" />
							Edit
						</DropdownMenuItem>
					) : null}
					{client.email ? (
						<DropdownMenuItem asChild>
							<a href={`mailto:${client.email}`}>
								<Sms className="mr-2 size-4 text-current" variant="Outline" />
								Email
							</a>
						</DropdownMenuItem>
					) : null}
					<DropdownMenuItem
						onClick={() => setShowDeleteDialog(true)}
						className="text-destructive focus:bg-secondary focus:text-destructive focus:[&_svg]:text-destructive"
					>
						<Trash className="mr-2 size-4 text-destructive" variant="Outline" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete {client.fullName}?</AlertDialogTitle>
						<AlertDialogDescription>
							Their cards, visits and health notes go with them, and they leave your Google Contacts. This can&apos;t be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleDelete();
							}}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							disabled={isPending}
						>
							{isPending ? (
								<Refresh
									className="mr-2 size-4 animate-spin"
									variant="Outline"
								/>
							) : (
								<Trash className="mr-2 size-4" variant="Bulk" />
							)}
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
