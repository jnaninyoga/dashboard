"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useConfirm } from "@/components/feedback/confirm";
import { RowActionsTrigger } from "@/components/row-actions-trigger";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deletePartnerAction } from "@/lib/actions/b2b/partners";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { type PartnerWithRelations } from "@/lib/types/b2b";

import { Buildings, Edit2, Trash } from "iconsax-reactjs";

import { PartnerDialog } from "./dialog";

interface PartnerActionsProps {
	partner: PartnerWithRelations;
	triggerClassName?: string;
}

export function PartnerActions({
	partner,
	triggerClassName,
}: PartnerActionsProps) {
	const router = useRouter();
	const [editOpen, setEditOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	const confirm = useConfirm();

	const handleDelete = async () => {
		const ok = await confirm({
			title: `Delete ${partner.companyName}?`,
			description:
				"This can't be undone. A partner with quotes or invoices can't be deleted.",
			confirmLabel: "Delete",
			destructive: true,
		});
		if (!ok) return;
		startTransition(async () => {
			const res = await deletePartnerAction(partner.id);
			if (res.success) {
				notify.success("Partner deleted");
				router.refresh();
			} else {
				notifyActionError(res, "Failed to delete partner");
			}
		});
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<RowActionsTrigger
						label={`Actions for ${partner.companyName}`}
						className={triggerClassName}
						disabled={isPending}
					/>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="border-secondary/20 w-48 rounded-xl shadow-xl"
				>
					<DropdownMenuItem
						asChild
						className="cursor-pointer p-3 text-xs font-bold tracking-wide uppercase"
					>
						<Link
							href={`/b2b/partners/${partner.id}`}
							className="flex items-center gap-2"
						>
							<Buildings size={16} variant="Outline" />
							View Profile
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem
						className="cursor-pointer p-3 text-xs font-bold tracking-wide uppercase"
						onSelect={(e) => {
							// Keep the dropdown's own close behaviour, then open our dialog
							// on the next tick so focus management doesn't fight us.
							e.preventDefault();
							setTimeout(() => setEditOpen(true), 0);
						}}
					>
						<Edit2 size={16} variant="Outline" />
						Edit Partner
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onSelect={(e) => {
							e.preventDefault();
							handleDelete();
						}}
						className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive focus:[&>svg]:text-destructive flex cursor-pointer items-center gap-2 p-3 text-xs font-bold tracking-wide uppercase"
					>
						<Trash size={16} variant="Bulk" className="text-destructive" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<PartnerDialog
				partner={partner}
				open={editOpen}
				onOpenChange={setEditOpen}
			/>
		</>
	);
}
